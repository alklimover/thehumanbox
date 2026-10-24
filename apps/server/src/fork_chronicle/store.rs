//! The chronicle's tables, in the world's own `world.sqlite` next to the dead
//! people's memories (`world_store.rs`), over a connection of its own.

use std::path::Path;
use std::sync::Mutex;

use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::Serialize;

use super::capture::{Capture, Row};
use super::classify::Category;

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS fork_chronicle (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    tick      INTEGER NOT NULL,
    src       TEXT NOT NULL,
    kind      TEXT NOT NULL,
    cat       TEXT NOT NULL,
    actor     TEXT NOT NULL,
    text      TEXT NOT NULL,
    era       TEXT NOT NULL,
    restored  INTEGER NOT NULL DEFAULT 0,
    fp        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fork_chronicle_tick ON fork_chronicle(tick, id);
CREATE INDEX IF NOT EXISTS idx_fork_chronicle_cat ON fork_chronicle(cat, tick, id);
CREATE TABLE IF NOT EXISTS fork_chronicle_link (
    entry_id    INTEGER NOT NULL,
    lineage_id  TEXT NOT NULL,
    name        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fork_chronicle_link_lineage ON fork_chronicle_link(lineage_id, entry_id);
CREATE INDEX IF NOT EXISTS idx_fork_chronicle_link_entry ON fork_chronicle_link(entry_id);
CREATE TABLE IF NOT EXISTS fork_chronicle_tribes (
    lineage_id    TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    first_tick    INTEGER NOT NULL,
    last_tick     INTEGER NOT NULL,
    died_out_tick INTEGER,
    peak          INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fork_chronicle_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
";

/// Where a chronicle left off: its last tick and the fingerprints written in it.
pub(crate) struct ResumePoint {
    pub tick: Option<u64>,
    pub fingerprints: Vec<i64>,
    /// The tick the chronicle began at, if it has begun.
    pub started: Option<u64>,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
pub(crate) struct TribeLink {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
pub(crate) struct EntryJson {
    pub id: i64,
    pub tick: u64,
    pub src: String,
    pub kind: String,
    pub cat: String,
    pub actor: String,
    pub text: String,
    pub era: String,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub restored: bool,
    pub tribes: Vec<TribeLink>,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
pub(crate) struct YearJson {
    pub year: u64,
    pub count: u64,
    /// The world's era at the year's last entry.
    pub era: String,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
pub(crate) struct TribeJson {
    pub id: String,
    pub name: String,
    pub first_tick: u64,
    pub last_tick: u64,
    pub died_out_tick: Option<u64>,
    pub peak: u32,
    pub entries: u64,
}

/// Which entries a page asks for.
#[derive(Default, Debug, Clone)]
pub(crate) struct Filter {
    /// Empty: every heading.
    pub categories: Vec<Category>,
    pub lineage: Option<String>,
}

impl Filter {
    fn clause(&self, args: &mut Vec<rusqlite::types::Value>) -> String {
        let mut sql = String::from("1");
        if !self.categories.is_empty() {
            let marks = vec!["?"; self.categories.len()].join(",");
            sql.push_str(&format!(" AND c.cat IN ({marks})"));
            for c in &self.categories {
                args.push(c.key().to_string().into());
            }
        }
        if let Some(lineage) = &self.lineage {
            sql.push_str(" AND c.id IN (SELECT entry_id FROM fork_chronicle_link WHERE lineage_id = ?)");
            args.push(lineage.clone().into());
        }
        sql
    }
}

pub(crate) struct ChronicleDb {
    hash: String,
    conn: Mutex<Connection>,
}

impl ChronicleDb {
    pub(crate) fn open(hash: &str, path: &Path) -> rusqlite::Result<Self> {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        conn.execute_batch(SCHEMA)?;
        Ok(ChronicleDb {
            hash: hash.to_string(),
            conn: Mutex::new(conn),
        })
    }

    pub(crate) fn hash(&self) -> &str {
        &self.hash
    }

    fn conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    /// After a crash the world restarts from its last save: what was written
    /// after that tick never happened in this world.
    pub(crate) fn roll_back_after(&self, tick: u64) -> rusqlite::Result<usize> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let t = tick as i64;
        tx.execute(
            "DELETE FROM fork_chronicle_link WHERE entry_id IN (SELECT id FROM fork_chronicle WHERE tick > ?1)",
            params![t],
        )?;
        let removed = tx.execute("DELETE FROM fork_chronicle WHERE tick > ?1", params![t])?;
        tx.execute(
            "DELETE FROM fork_chronicle_tribes WHERE first_tick > ?1",
            params![t],
        )?;
        tx.execute(
            "UPDATE fork_chronicle_tribes SET died_out_tick = NULL WHERE died_out_tick > ?1",
            params![t],
        )?;
        tx.execute(
            "UPDATE fork_chronicle_tribes SET last_tick = ?1 WHERE last_tick > ?1",
            params![t],
        )?;
        tx.commit()?;
        Ok(removed)
    }

    pub(crate) fn resume_point(&self) -> rusqlite::Result<ResumePoint> {
        let conn = self.conn();
        let tick: Option<i64> = conn.query_row("SELECT MAX(tick) FROM fork_chronicle", [], |r| r.get(0))?;
        let mut fingerprints = Vec::new();
        if let Some(t) = tick {
            let mut stmt = conn.prepare("SELECT fp FROM fork_chronicle WHERE tick = ?1")?;
            for fp in stmt.query_map(params![t], |r| r.get::<_, i64>(0))? {
                fingerprints.push(fp?);
            }
        }
        let started: Option<String> = conn
            .query_row(
                "SELECT value FROM fork_chronicle_meta WHERE key = 'started_tick'",
                [],
                |r| r.get(0),
            )
            .optional()?;
        Ok(ResumePoint {
            tick: tick.map(|t| t.max(0) as u64),
            fingerprints,
            started: started.and_then(|s| s.parse().ok()),
        })
    }

    pub(crate) fn mark_started(&self, tick: u64) -> rusqlite::Result<()> {
        self.conn().execute(
            "INSERT OR IGNORE INTO fork_chronicle_meta (key, value) VALUES ('started_tick', ?1)",
            params![tick.to_string()],
        )?;
        Ok(())
    }

    /// Tribes the chronicle knows that have nobody alive, and are not marked yet
    /// (they died while the world ran without a chronicle).
    pub(crate) fn mark_died_out_unless(
        &self,
        alive: &std::collections::HashSet<String, impl std::hash::BuildHasher>,
        tick: u64,
    ) -> rusqlite::Result<()> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let ids: Vec<String> = {
            let mut stmt =
                tx.prepare("SELECT lineage_id FROM fork_chronicle_tribes WHERE died_out_tick IS NULL")?;
            let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
            rows.collect::<rusqlite::Result<_>>()?
        };
        for id in ids.iter().filter(|id| !alive.contains(*id)) {
            tx.execute(
                "UPDATE fork_chronicle_tribes SET died_out_tick = ?2 WHERE lineage_id = ?1",
                params![id, tick as i64],
            )?;
        }
        tx.commit()
    }

    /// Writes captures in one transaction.
    pub(crate) fn write(&self, captures: &[Capture]) -> rusqlite::Result<usize> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let mut written = 0;
        {
            let mut entry = tx.prepare_cached(
                "INSERT INTO fork_chronicle (tick, src, kind, cat, actor, text, era, restored, fp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )?;
            let mut link = tx.prepare_cached(
                "INSERT INTO fork_chronicle_link (entry_id, lineage_id, name) VALUES (?, ?, ?)",
            )?;
            let mut tribe = tx.prepare_cached(
                "INSERT INTO fork_chronicle_tribes (lineage_id, name, first_tick, last_tick)
                 VALUES (?1, ?2, ?3, ?3)
                 ON CONFLICT(lineage_id) DO UPDATE SET
                    name = CASE WHEN excluded.last_tick >= last_tick THEN excluded.name ELSE name END,
                    first_tick = MIN(first_tick, excluded.first_tick),
                    last_tick = MAX(last_tick, excluded.last_tick)",
            )?;
            let mut died = tx.prepare_cached(
                "INSERT INTO fork_chronicle_tribes (lineage_id, name, first_tick, last_tick, died_out_tick, peak)
                 VALUES (?1, ?2, ?3, ?3, ?3, ?4)
                 ON CONFLICT(lineage_id) DO UPDATE SET
                    died_out_tick = excluded.died_out_tick,
                    last_tick = MAX(last_tick, excluded.last_tick),
                    peak = MAX(peak, excluded.peak)",
            )?;
            let mut revived = tx.prepare_cached(
                "UPDATE fork_chronicle_tribes SET died_out_tick = NULL WHERE lineage_id = ?1",
            )?;
            for capture in captures {
                for row in &capture.rows {
                    write_row(&tx, &mut entry, &mut link, &mut tribe, row)?;
                    written += 1;
                }
                for (lid, name, peak) in &capture.died_out {
                    died.execute(params![lid, name, capture.tick as i64, *peak as i64])?;
                }
                for lid in &capture.revived {
                    revived.execute(params![lid])?;
                }
            }
        }
        tx.commit()?;
        Ok(written)
    }

    pub(crate) fn page(
        &self,
        filter: &Filter,
        before: Option<(u64, i64)>,
        after_id: Option<i64>,
        limit: usize,
    ) -> rusqlite::Result<Vec<EntryJson>> {
        let conn = self.conn();
        let mut args: Vec<rusqlite::types::Value> = Vec::new();
        let mut sql = format!(
            "SELECT c.id, c.tick, c.src, c.kind, c.cat, c.actor, c.text, c.era, c.restored
               FROM fork_chronicle c WHERE {}",
            filter.clause(&mut args)
        );
        if let Some((tick, id)) = before {
            sql.push_str(" AND (c.tick < ? OR (c.tick = ? AND c.id < ?))");
            args.push((tick as i64).into());
            args.push((tick as i64).into());
            args.push(id.into());
        }
        if let Some(id) = after_id {
            sql.push_str(" AND c.id > ?");
            args.push(id.into());
        }
        sql.push_str(" ORDER BY c.tick DESC, c.id DESC LIMIT ?");
        args.push((limit as i64).into());
        let mut stmt = conn.prepare(&sql)?;
        let mut out: Vec<EntryJson> = stmt
            .query_map(params_from_iter(args), |r| {
                Ok(EntryJson {
                    id: r.get(0)?,
                    tick: r.get::<_, i64>(1)?.max(0) as u64,
                    src: r.get(2)?,
                    kind: r.get(3)?,
                    cat: r.get(4)?,
                    actor: r.get(5)?,
                    text: r.get(6)?,
                    era: r.get(7)?,
                    restored: r.get::<_, i64>(8)? != 0,
                    tribes: Vec::new(),
                })
            })?
            .collect::<rusqlite::Result<_>>()?;
        if !out.is_empty() {
            let marks = vec!["?"; out.len()].join(",");
            let mut stmt = conn.prepare(&format!(
                "SELECT entry_id, lineage_id, name FROM fork_chronicle_link WHERE entry_id IN ({marks}) ORDER BY rowid"
            ))?;
            let ids: Vec<i64> = out.iter().map(|e| e.id).collect();
            let links = stmt.query_map(params_from_iter(ids), |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                ))
            })?;
            let index: std::collections::HashMap<i64, usize> =
                out.iter().enumerate().map(|(i, e)| (e.id, i)).collect();
            for link in links {
                let (entry, id, name) = link?;
                if let Some(&i) = index.get(&entry) {
                    out[i].tribes.push(TribeLink { id, name });
                }
            }
        }
        Ok(out)
    }

    /// How many entries match, by calendar year (newest first).
    pub(crate) fn years(&self, filter: &Filter) -> rusqlite::Result<Vec<YearJson>> {
        let conn = self.conn();
        let mut args = Vec::new();
        let sql = format!(
            "SELECT c.tick / {year} AS y, COUNT(*), c.era, MAX(c.tick)
               FROM fork_chronicle c WHERE {} GROUP BY y ORDER BY y DESC",
            filter.clause(&mut args),
            year = sim_core::sim::cosmos::YEAR_LENGTH_TICKS,
        );
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params_from_iter(args), |r| {
            Ok(YearJson {
                year: r.get::<_, i64>(0)?.max(0) as u64,
                count: r.get::<_, i64>(1)?.max(0) as u64,
                era: r.get(2)?,
            })
        })?;
        rows.collect()
    }

    pub(crate) fn tribes(&self) -> rusqlite::Result<Vec<TribeJson>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT t.lineage_id, t.name, t.first_tick, t.last_tick, t.died_out_tick, t.peak,
                    (SELECT COUNT(*) FROM fork_chronicle_link l WHERE l.lineage_id = t.lineage_id)
               FROM fork_chronicle_tribes t ORDER BY t.name COLLATE NOCASE, t.lineage_id",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(TribeJson {
                id: r.get(0)?,
                name: r.get(1)?,
                first_tick: r.get::<_, i64>(2)?.max(0) as u64,
                last_tick: r.get::<_, i64>(3)?.max(0) as u64,
                died_out_tick: r.get::<_, Option<i64>>(4)?.map(|t| t.max(0) as u64),
                peak: r.get::<_, i64>(5)?.clamp(0, u32::MAX as i64) as u32,
                entries: r.get::<_, i64>(6)?.max(0) as u64,
            })
        })?;
        rows.collect()
    }

    /// Folds the write-ahead log into the database file (for measuring its size).
    #[cfg(test)]
    pub(crate) fn checkpoint(&self) -> rusqlite::Result<()> {
        self.conn().execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")
    }

    #[cfg(test)]
    pub(crate) fn count(&self) -> rusqlite::Result<u64> {
        let n: i64 = self
            .conn()
            .query_row("SELECT COUNT(*) FROM fork_chronicle", [], |r| r.get(0))?;
        Ok(n.max(0) as u64)
    }
}

fn write_row(
    tx: &rusqlite::Transaction<'_>,
    entry: &mut rusqlite::CachedStatement<'_>,
    link: &mut rusqlite::CachedStatement<'_>,
    tribe: &mut rusqlite::CachedStatement<'_>,
    row: &Row,
) -> rusqlite::Result<()> {
    entry.execute(params![
        row.tick as i64,
        row.source.key(),
        row.kind,
        row.category.key(),
        row.actor,
        row.text,
        row.era,
        row.restored as i64,
        row.fp,
    ])?;
    let id = tx.last_insert_rowid();
    for (lid, name) in &row.tribes {
        link.execute(params![id, lid, name])?;
        tribe.execute(params![lid, name, row.tick as i64])?;
    }
    Ok(())
}
