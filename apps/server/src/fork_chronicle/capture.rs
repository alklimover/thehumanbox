//! Taking the new entries of the world's logs, each exactly once.
//!
//! The event log, the headlines and the stories are bounded queues without a
//! running counter: old entries fall off the front, and the event log even
//! drops chatter from its middle. Every entry carries the tick it was written
//! in, and entries are only ever appended with the current tick. So the cursor
//! is "the last tick looked at" plus the fingerprints of the kept entries of
//! that tick already taken: an entry of a later tick is new, an entry of that
//! tick is new unless its fingerprint is still unclaimed in the set. This holds
//! for a batch of ticks, for player commands between two ticks (they write
//! with the same tick number), and across a restart, when the set is read back
//! from the database.

use std::collections::{HashMap, HashSet};
use std::hash::BuildHasherDefault;

use sim_core::sim::simulation::{Event, Simulation, StoryEntry};

use super::classify::{event_category, fingerprint, headline_category, normalized, Category};

/// The census walks everyone each time someone dies: the sim's fast hasher, not SipHash.
type FastSet<T> = HashSet<T, BuildHasherDefault<sim_core::hashing::FxHasher>>;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Source {
    Event,
    Headline,
    Story,
    /// The world's era ladder (`history.era_history`), only read when an old world is salvaged.
    Era,
    /// Noticed by the server itself: a tribe with nobody left.
    Server,
}

impl Source {
    pub(crate) fn key(self) -> &'static str {
        match self {
            Source::Event => "event",
            Source::Headline => "headline",
            Source::Story => "story",
            Source::Era => "era",
            Source::Server => "server",
        }
    }
}

/// One line of the chronicle, as the simulation wrote it.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Row {
    pub tick: u64,
    pub source: Source,
    /// The event type; for a headline that repeats an event, that event's type.
    pub kind: String,
    pub category: Category,
    pub actor: String,
    pub text: String,
    /// The world's era when it was written.
    pub era: String,
    /// Taken from what was left in the logs of a world that had no chronicle yet.
    pub restored: bool,
    pub fp: i64,
    /// The tribes it names: lineage id and the name they had then.
    pub tribes: Vec<(String, String)>,
}

pub(crate) const DIED_OUT: &str = "died_out";

/// What one capture found.
#[derive(Default, Debug)]
pub(crate) struct Capture {
    /// The world's tick when it was taken.
    pub tick: u64,
    pub rows: Vec<Row>,
    /// Tribes with nobody left now: lineage id, name and largest size.
    pub died_out: Vec<(String, String, u32)>,
    /// Tribes that had died out and have someone alive again.
    pub revived: Vec<String>,
}

impl Capture {
    pub(crate) fn is_empty(&self) -> bool {
        self.rows.is_empty() && self.died_out.is_empty() && self.revived.is_empty()
    }
}

fn event_fp(e: &Event) -> i64 {
    fingerprint(&["e", &e.etype, &e.actor, &e.detail])
}

fn headline_fp(text: &str) -> i64 {
    fingerprint(&["h", text])
}

fn story_fp(s: &StoryEntry) -> i64 {
    fingerprint(&["s", &s.org_name, &s.story])
}

/// Where the capture stands.
pub(crate) struct Cursor {
    tick: u64,
    /// Fingerprints of the entries of `tick` already taken, with their counts.
    seen: HashMap<i64, u32>,
    /// Tribes with someone alive after the last capture.
    alive: FastSet<String>,
    /// Tribes noticed dying out, so a raised one can be told apart.
    died_out: HashSet<String>,
    /// What the census of the tribes was last taken at (see `census_due`).
    census: Census,
}

/// When the tribes were last counted. Counting walks everyone, so it is done
/// when something can have changed: someone died, someone was born or added,
/// a tribe line was written, or a few hundred ticks have passed.
#[derive(Default, Clone, Copy, PartialEq, Eq)]
struct Census {
    deaths: u64,
    people: usize,
    tick: u64,
}

impl Census {
    fn of(sim: &Simulation) -> Self {
        Census {
            deaths: sim.history.deaths_by_year.iter().map(|&n| u64::from(n)).sum(),
            people: sim.organisms.len(),
            tick: sim.tick_count,
        }
    }
}

const CENSUS_EVERY: u64 = 300;

impl Cursor {
    /// A cursor that has taken the entries of `tick` whose fingerprints are
    /// `seen`, and everything before it. A fresh chronicle starts at tick 0
    /// with nothing seen, so all the logs still hold is taken.
    pub(crate) fn resume(sim: &Simulation, tick: u64, seen: impl IntoIterator<Item = i64>) -> Self {
        let mut counts = HashMap::new();
        for fp in seen {
            *counts.entry(fp).or_insert(0u32) += 1;
        }
        Cursor {
            tick,
            seen: counts,
            alive: alive_lineages(sim).into_iter().map(str::to_string).collect(),
            died_out: HashSet::new(),
            census: Census::of(sim),
        }
    }

    pub(crate) fn alive(&self) -> &FastSet<String> {
        &self.alive
    }

    /// The new entries since the last call, oldest first, and the tribes that
    /// died out or came back. Reads the world only.
    pub(crate) fn capture(&mut self, sim: &Simulation, restored: bool) -> Capture {
        let now = sim.tick_count;
        if now < self.tick {
            // Time does not run backwards in one world; start over from here.
            self.tick = now;
            self.seen.clear();
        }
        let from = self.tick;
        let mut claimed = std::mem::take(&mut self.seen);
        let mut next_seen: HashMap<i64, u32> = HashMap::new();
        let mut is_new = |tick: u64, fp: i64| -> bool {
            if tick == now {
                *next_seen.entry(fp).or_insert(0) += 1;
            }
            if tick > from {
                return true;
            }
            match claimed.get_mut(&fp) {
                Some(n) if *n > 0 => {
                    *n -= 1;
                    false
                }
                _ => true,
            }
        };

        // Only the tail written since `from` is looked at: a handful of entries per tick.
        let events: Vec<&Event> = tail(&sim.events, from, |e| e.tick);
        let headlines: Vec<&(u64, String)> = tail(&sim.headlines, from, |h| h.0);
        let stories: Vec<&StoryEntry> = tail(&sim.story_history, from, |s| s.tick);

        let mut links = Links::new(sim);
        let era = sim.current_era.as_str();
        let mut rows = Vec::new();

        // Headlines first: an event that repeats a headline of its tick is told by the headline.
        let headline_texts: Vec<(u64, String)> = headlines.iter().map(|h| (h.0, normalized(&h.1))).collect();
        let mut twins: HashMap<(u64, String), &Event> = HashMap::new();
        for e in &events {
            if event_category(&e.etype, &e.detail).is_some() {
                twins.entry((e.tick, normalized(&e.detail))).or_insert(e);
            }
        }
        for (h, (tick, norm)) in headlines.iter().zip(&headline_texts) {
            let fp = headline_fp(&h.1);
            if !is_new(*tick, fp) {
                continue;
            }
            let twin = twins.get(&(*tick, norm.clone()));
            let (kind, actor) = twin.map_or(("headline", ""), |e| (e.etype.as_str(), e.actor.as_str()));
            let mut tribes = links.in_text(&h.1);
            if twin.is_some() {
                links.add_actor(&mut tribes, actor);
            } else if let Some(person) = person_of_headline(&h.1) {
                links.add_person(&mut tribes, person);
            }
            rows.push(Row {
                tick: *tick,
                source: Source::Headline,
                kind: kind.to_string(),
                // A headline that repeats an event files under the event's heading.
                category: twin
                    .and_then(|e| event_category(&e.etype, &e.detail))
                    .unwrap_or_else(|| headline_category(&h.1)),
                actor: actor.to_string(),
                text: h.1.clone(),
                era: era.to_string(),
                restored,
                fp,
                tribes,
            });
        }
        let told: HashSet<(u64, &str)> = headline_texts.iter().map(|(t, n)| (*t, n.as_str())).collect();
        for e in &events {
            let Some(category) = event_category(&e.etype, &e.detail) else {
                continue;
            };
            let fp = event_fp(e);
            if !is_new(e.tick, fp) || told.contains(&(e.tick, normalized(&e.detail).as_str())) {
                continue;
            }
            let mut tribes = links.in_text(&e.detail);
            links.add_actor(&mut tribes, &e.actor);
            rows.push(Row {
                tick: e.tick,
                source: Source::Event,
                kind: e.etype.clone(),
                category,
                actor: e.actor.clone(),
                text: e.detail.clone(),
                era: era.to_string(),
                restored,
                fp,
                tribes,
            });
        }
        for s in &stories {
            let fp = story_fp(s);
            if !is_new(s.tick, fp) {
                continue;
            }
            let mut tribes = Vec::new();
            links.add_lineage(&mut tribes, &s.lineage_id);
            rows.push(Row {
                tick: s.tick,
                source: Source::Story,
                kind: "story".to_string(),
                category: Category::Milestones,
                actor: s.org_name.clone(),
                text: s.story.clone(),
                era: era.to_string(),
                restored,
                fp,
                tribes,
            });
        }
        // Every kept entry of `now`, taken before or just now, is what the next call has seen.
        self.seen = next_seen;
        self.tick = now;

        let mut out = Capture {
            tick: now,
            rows,
            ..Capture::default()
        };
        self.notice_died_out(sim, &mut out, restored);
        out.rows.sort_by_key(|r| r.tick);
        out
    }

    /// Tribes with nobody left since the last capture get a row of their own,
    /// unless the simulation tells it itself: its dynasty watch announces every
    /// tribe that ever reached 8, and the refugee line tells the last ones taken in.
    fn notice_died_out(&mut self, sim: &Simulation, out: &mut Capture, restored: bool) {
        let census = Census::of(sim);
        let due = census.deaths != self.census.deaths
            || census.people != self.census.people
            || census.tick >= self.census.tick + CENSUS_EVERY
            || census.tick < self.census.tick
            || out.rows.iter().any(|r| r.category == Category::Tribes);
        if !due {
            return;
        }
        self.census = census;
        let now_alive = alive_lineages(sim);
        if now_alive.len() == self.alive.len() && self.alive.iter().all(|l| now_alive.contains(l.as_str())) {
            return;
        }
        for lid in &now_alive {
            if !self.alive.contains(*lid) && self.died_out.remove(*lid) {
                out.revived.push(lid.to_string());
            }
        }
        let gone: Vec<String> = self
            .alive
            .iter()
            .filter(|l| !now_alive.contains(l.as_str()))
            .cloned()
            .collect();
        for lid in gone {
            let name = sim
                .lineage_names
                .get(&lid)
                .cloned()
                .unwrap_or_else(|| lid.clone());
            let peak = sim.lineage_peak_pop.get(&lid).copied().unwrap_or(0);
            let told = peak >= 8
                || out.rows.iter().any(|r| {
                    r.tribes.iter().any(|(id, _)| *id == lid)
                        && (r.text.starts_with('\u{1F480}') || r.text.starts_with('\u{1F3D5}'))
                });
            self.died_out.insert(lid.clone());
            if !told {
                out.rows.push(Row {
                    tick: sim.tick_count,
                    source: Source::Server,
                    kind: DIED_OUT.to_string(),
                    category: Category::Tribes,
                    actor: name.clone(),
                    text: format!("The {name} have died out."),
                    era: sim.current_era.clone(),
                    restored,
                    fp: fingerprint(&["x", &lid, &sim.tick_count.to_string()]),
                    tribes: vec![(lid.clone(), name.clone())],
                });
            }
            out.died_out.push((lid, name, peak));
        }
        self.alive = now_alive.into_iter().map(str::to_string).collect();
    }
}

/// The world's era ladder, for a salvaged world: the eras the event log no
/// longer tells. Called once, with the rows the first capture produced.
pub(crate) fn salvaged_eras(sim: &Simulation, rows: &[Row]) -> Vec<Row> {
    let told: HashSet<u64> = rows.iter().filter(|r| r.kind == "era").map(|r| r.tick).collect();
    sim.history
        .era_history
        .iter()
        .filter(|e| !told.contains(&e.tick))
        .map(|e| Row {
            tick: e.tick,
            source: Source::Era,
            kind: "era".to_string(),
            category: Category::Eras,
            actor: "world".to_string(),
            text: e.era.clone(),
            era: e.era.clone(),
            restored: true,
            fp: fingerprint(&["r", &e.era, &e.tick.to_string()]),
            tribes: Vec::new(),
        })
        .collect()
}

/// The entries of a log written at `from` or later, oldest first.
fn tail<T>(log: &std::collections::VecDeque<T>, from: u64, tick: impl Fn(&T) -> u64) -> Vec<&T> {
    let mut out: Vec<&T> = log.iter().rev().take_while(|e| tick(e) >= from).collect();
    out.reverse();
    out
}

fn alive_lineages(sim: &Simulation) -> FastSet<&str> {
    let mut out: FastSet<&str> = FastSet::default();
    let mut last: &str = "";
    for o in &sim.organisms {
        // Kin are mostly next to each other: skip the hash for a run of one tribe.
        if o.alive && o.lineage_id != last {
            last = o.lineage_id.as_str();
            out.insert(last);
        }
    }
    out
}

/// "Daki became an elder, carrying: …" and "Daki is gone. …" name a person first.
fn person_of_headline(text: &str) -> Option<&str> {
    let (name, rest) = text.split_once(' ')?;
    (rest.starts_with("became an elder") || rest.starts_with("is gone.")).then_some(name)
}

/// Finds the tribes a line is about, by the names and ids it carries.
struct Links<'a> {
    sim: &'a Simulation,
    by_name: Option<HashMap<&'a str, &'a str>>,
}

impl<'a> Links<'a> {
    fn new(sim: &'a Simulation) -> Self {
        Links { sim, by_name: None }
    }

    fn by_name(&mut self) -> &HashMap<&'a str, &'a str> {
        let sim = self.sim;
        self.by_name.get_or_insert_with(|| {
            let mut map: HashMap<&str, &str> = HashMap::with_capacity(sim.lineage_names.len());
            for (id, name) in &sim.lineage_names {
                // Two tribes can share a name; the same one wins every time.
                map.entry(name.as_str())
                    .and_modify(|kept| *kept = (*kept).min(id.as_str()))
                    .or_insert(id.as_str());
            }
            map
        })
    }

    fn add_lineage(&mut self, out: &mut Vec<(String, String)>, lid: &str) {
        if lid.is_empty() || out.iter().any(|(id, _)| id == lid) {
            return;
        }
        if let Some(name) = self.sim.lineage_names.get(lid) {
            out.push((lid.to_string(), name.clone()));
        }
    }

    /// The tribe of a person by name, the living first. A walk over the people,
    /// but only for the few lines a tick writes about someone.
    fn add_person(&mut self, out: &mut Vec<(String, String)>, name: &str) {
        let sim = self.sim;
        let person = sim
            .organisms
            .iter()
            .find(|o| o.alive && o.name == name)
            .or_else(|| sim.organisms.iter().rev().find(|o| !o.alive && o.name == name));
        if let Some(o) = person {
            self.add_lineage(out, &o.lineage_id);
        }
    }

    /// The actor of an event: a tribe by name or id, a battle ("battle_3120_<a>_<b>"), or a person.
    fn add_actor(&mut self, out: &mut Vec<(String, String)>, actor: &str) {
        let actor = actor.strip_prefix("the ").unwrap_or(actor);
        if actor.is_empty() {
            return;
        }
        if let Some(lid) = self.by_name().get(actor).copied() {
            return self.add_lineage(out, lid);
        }
        if self.sim.lineage_names.contains_key(actor) {
            return self.add_lineage(out, actor);
        }
        if actor.starts_with("battle_") {
            for part in actor.split('_') {
                if self.sim.lineage_names.contains_key(part) {
                    self.add_lineage(out, part);
                }
            }
            return;
        }
        self.add_person(out, actor);
    }

    /// Tribes named in a text, by name or by lineage id, in order of appearance.
    fn in_text(&mut self, text: &str) -> Vec<(String, String)> {
        let mut out = Vec::new();
        for word in text.split(|c: char| !c.is_ascii_alphanumeric()) {
            if word.len() < 2 {
                continue;
            }
            if word.as_bytes()[0].is_ascii_uppercase() {
                if let Some(lid) = self.by_name().get(word).copied() {
                    self.add_lineage(&mut out, lid);
                }
            } else if word.len() == 8 && word.bytes().all(|b| b.is_ascii_hexdigit()) {
                let lid = self
                    .sim
                    .lineage_names
                    .get_key_value(word)
                    .map(|(k, _)| k.as_str());
                if let Some(lid) = lid {
                    self.add_lineage(&mut out, lid);
                }
            }
        }
        out
    }
}
