//! Fork: the world's whole chronicle. The simulation keeps only the last 600
//! events, 80 headlines and 80 stories; after every tick the server takes what
//! is new in them (only reading the world) and keeps it for good in the
//! world's `world.sqlite`, with the tribes each line is about and their names
//! at the time, plus the tribes it notices dying out. `GET /chronicle` and
//! `GET /chronicle/tribes` serve it to the "Whole history" tab
//! (apps/web/src/fork/chronicle/).
//!
//! "Don't miss what matters" (`watch`): when a line the player asked to see is
//! written while time runs fast, the world is paused or slowed in that same
//! tick, through the runtime control, and `GET /chronicle/alerts` tells the
//! client; `POST /chronicle/watch` carries the player's choices.
//!
//! Hooks: `start` in main.rs once the world is loaded, `after_tick` in
//! tick_loop.rs under the tick's own lock (it ends a batch of ticks when it
//! stops the world), `shutdown` in main.rs after the final save, the routes in
//! router.rs.

mod capture;
mod classify;
mod routes;
mod store;
#[cfg(test)]
mod tests;
mod watch;
mod writer;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock, Mutex, OnceLock};

use sim_core::sim::simulation::Simulation;

use capture::{salvaged_eras, Cursor};
use store::{ChronicleDb, TribeLink};
use watch::{Action, Pace, Watch};
use writer::Writer;

pub(crate) use routes::{routes, sandbox_routes};

/// The chronicle of the live world.
pub(crate) struct Chronicle {
    live: Mutex<Option<Live>>,
    writer: Writer,
    /// Where the worlds are; None for the server's own `worlds/` folder.
    root: Option<PathBuf>,
    watch: Mutex<Watch>,
    /// The tick loop's pause and speed, once the server has started.
    runtime: OnceLock<crate::SharedRuntimeControl>,
}

struct Live {
    db: Arc<ChronicleDb>,
    cursor: Cursor,
    /// The first tribe into each era, for a new world era's "Show".
    first_into: HashMap<String, TribeLink>,
}

impl Chronicle {
    pub(crate) fn new(root: Option<PathBuf>) -> Self {
        Chronicle {
            live: Mutex::new(None),
            writer: Writer::spawn(),
            root,
            watch: Mutex::new(Watch::default()),
            runtime: OnceLock::new(),
        }
    }

    pub(crate) fn set_runtime(&self, runtime: crate::SharedRuntimeControl) {
        let _ = self.runtime.set(runtime);
    }

    fn watch(&self) -> std::sync::MutexGuard<'_, Watch> {
        self.watch.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    fn sqlite_path(&self, hash: &str) -> PathBuf {
        match &self.root {
            Some(root) => root.join(hash).join("world.sqlite"),
            None => crate::world_store::world_sqlite_path(hash),
        }
    }

    fn live(&self) -> std::sync::MutexGuard<'_, Option<Live>> {
        self.live.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    /// The live world's database, for the routes.
    pub(crate) fn db(&self) -> Option<Arc<ChronicleDb>> {
        self.live().as_ref().map(|l| l.db.clone())
    }

    /// Takes up the chronicle of the world in `hash`. `at_load`: the world was
    /// just read from its save, so whatever the chronicle has past the save's
    /// tick was lived by a run that crashed before saving it, and a world that
    /// never had a chronicle gets what is left in its logs, marked restored.
    pub(crate) fn attach(&self, sim: &Simulation, hash: &str, at_load: bool) {
        let mut live = self.live();
        *live = None;
        let db = match ChronicleDb::open(hash, &self.sqlite_path(hash)) {
            Ok(db) => Arc::new(db),
            Err(error) => {
                tracing::warn!(target: "chronicle", "worlds/{}: no chronicle: {}", hash, error);
                return;
            }
        };
        if at_load {
            match db.roll_back_after(sim.tick_count) {
                Ok(0) => {}
                Ok(n) => tracing::info!(target: "chronicle",
                    "dropped {} entries written after the save at tick {}", n, sim.tick_count),
                Err(error) => tracing::warn!(target: "chronicle", "roll back: {}", error),
            }
        }
        let point = match db.resume_point() {
            Ok(point) => point,
            Err(error) => {
                tracing::warn!(target: "chronicle", "worlds/{}: unreadable chronicle: {}", hash, error);
                return;
            }
        };
        let fresh = point.tick.is_none() && point.started.is_none();
        if point.started.is_none() {
            if let Err(error) = db.mark_started(sim.tick_count) {
                tracing::warn!(target: "chronicle", "mark start: {}", error);
            }
        }
        let restored = at_load && fresh && sim.tick_count > 0;
        let mut cursor = Cursor::resume(sim, point.tick.unwrap_or(0), point.fingerprints);
        if !fresh {
            if let Err(error) = db.mark_died_out_unless(cursor.alive(), sim.tick_count) {
                tracing::warn!(target: "chronicle", "mark died out: {}", error);
            }
        }
        let mut first_into: HashMap<String, TribeLink> = match db.first_into_eras() {
            Ok(firsts) => firsts.into_iter().collect(),
            Err(error) => {
                tracing::warn!(target: "chronicle", "first into eras: {}", error);
                HashMap::new()
            }
        };
        let mut first = cursor.capture(sim, restored);
        note_first_into(&mut first_into, &first.rows);
        if restored {
            let eras = salvaged_eras(sim, &first.rows);
            first.rows.extend(eras);
            first.rows.sort_by_key(|r| r.tick);
            tracing::info!(target: "chronicle",
                "worlds/{}: began the chronicle at tick {} with {} entries left in the logs",
                hash, sim.tick_count, first.rows.len());
        }
        self.writer.send(db.clone(), first);
        *live = Some(Live {
            db,
            cursor,
            first_into,
        });
    }

    /// After a tick or a batch of commands, under the lock that ran them:
    /// `store_hash` is the world store taken under that same lock, so a reset
    /// between two ticks sends each line to its own world. True when it has
    /// just paused or slowed the world, so the batch should end here.
    pub(crate) fn after_tick(&self, sim: &Simulation, store_hash: Option<&str>) -> bool {
        let Some(hash) = store_hash else {
            *self.live() = None;
            return false;
        };
        let mut live = self.live();
        let Some(l) = live.as_mut().filter(|l| l.db.hash() == hash) else {
            drop(live);
            self.attach(sim, hash, false);
            return false;
        };
        let capture = l.cursor.capture(sim, false);
        note_first_into(&mut l.first_into, &capture.rows);
        let stop = self.runtime.get().and_then(|runtime| {
            let pace = Pace {
                paused: runtime.paused(),
                speed: runtime.speed(),
            };
            let first_into = &l.first_into;
            let alert = self
                .watch()
                .consider(&capture.rows, pace, std::time::Instant::now(), |era| {
                    first_into.get(era).cloned()
                })?;
            match alert.action {
                Action::Pause => runtime.set_paused(true),
                Action::Slow => {
                    runtime.set_speed(1.0);
                }
                Action::Ignore => {}
            }
            tracing::info!(target: "chronicle",
                "{:?} at tick {} for {}: {}", alert.action, alert.tick, alert.main.rule, alert.main.text);
            Some(alert.id)
        });
        self.writer.send(l.db.clone(), capture);
        stop.is_some()
    }

    pub(crate) fn flush(&self) {
        self.writer.flush(std::time::Duration::from_secs(3));
    }
}

/// Keeps the first tribe seen entering each era.
fn note_first_into(first_into: &mut HashMap<String, TribeLink>, rows: &[capture::Row]) {
    for row in rows.iter().filter(|r| r.kind == "era_advance") {
        let (Some(era), Some((id, name))) = (watch::era_of_tribe_line(&row.text), row.tribes.first()) else {
            continue;
        };
        first_into.entry(era.to_string()).or_insert_with(|| TribeLink {
            id: id.clone(),
            name: name.clone(),
        });
    }
}

static CHRONICLE: LazyLock<Chronicle> = LazyLock::new(|| Chronicle::new(None));

pub(crate) fn global() -> &'static Chronicle {
    &CHRONICLE
}

/// main.rs: the world has been loaded (or made), its store opened and the runtime control made.
pub(crate) async fn start(
    sim: &crate::SharedSim,
    world_store: &crate::SharedWorldStore,
    runtime: &crate::SharedRuntimeControl,
) {
    CHRONICLE.set_runtime(runtime.clone());
    let s = sim.lock().await;
    if let Some(store) = world_store.get() {
        tokio::task::block_in_place(|| CHRONICLE.attach(&s, store.hash(), true));
    }
}

/// tick_loop.rs: after each tick, under its lock. True when the world was just
/// paused or slowed for something that matters: the batch ends there.
pub(crate) fn after_tick(sim: &Simulation, world_store: &crate::SharedWorldStore) -> bool {
    let store = world_store.get();
    CHRONICLE.after_tick(sim, store.as_deref().map(|s| s.hash()))
}

/// main.rs: after the final save, so the last second of lines is not left in the queue.
pub(crate) fn shutdown() {
    CHRONICLE.flush();
}
