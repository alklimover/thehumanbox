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
    /// The sex of the person the line is about, for the grammar of a translation.
    pub sex: Option<&'static str>,
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
        let era = sim.current_era.as_str();
        let rows: Vec<Row> = lines_since(sim, from)
            .into_iter()
            .filter(|l| is_new(l.tick, l.fp))
            .map(|l| Row {
                era: era.to_string(),
                restored,
                ..l
            })
            .collect();
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
                    sex: None,
                });
            }
            out.died_out.push((lid, name, peak));
        }
        self.alive = now_alive.into_iter().map(str::to_string).collect();
    }
}

/// Every kept line of the logs written at `from` or later, oldest log first,
/// without the cursor: what a capture of those ticks can produce. A headline
/// and an event that tell the same fact in the same tick are one line, told by
/// the headline with the event's kind, actor and heading (see `same_fact`).
pub(crate) fn lines_since(sim: &Simulation, from: u64) -> Vec<Row> {
    let events: Vec<&Event> = tail(&sim.events, from, |e| e.tick);
    let headlines: Vec<&(u64, String)> = tail(&sim.headlines, from, |h| h.0);
    let stories: Vec<&StoryEntry> = tail(&sim.story_history, from, |s| s.tick);
    let mut links = Links::new(sim);
    let line = |tick, source, kind: &str, category, actor: &str, text: &str, fp, tribes, sex| Row {
        tick,
        source,
        kind: kind.to_string(),
        category,
        actor: actor.to_string(),
        text: text.to_string(),
        era: String::new(),
        restored: false,
        fp,
        tribes,
        sex,
    };

    let mut told = vec![false; events.len()];
    let mut out = Vec::new();
    let candidates: Vec<(usize, Row)> = events
        .iter()
        .enumerate()
        .filter_map(|(i, e)| {
            let category = event_category(&e.etype, &e.detail)?;
            let mut tribes = links.in_text(&e.detail);
            let sex = links.add_actor(&mut tribes, &e.actor);
            let fp = event_fp(e);
            Some((
                i,
                line(
                    e.tick,
                    Source::Event,
                    &e.etype,
                    category,
                    &e.actor,
                    &e.detail,
                    fp,
                    tribes,
                    sex,
                ),
            ))
        })
        .collect();
    for (tick, text) in &headlines {
        let mut tribes = links.in_text(text);
        let person = person_of_headline(text);
        if let Some(name) = person.filter(|_| names_its_person_first(text)) {
            links.add_person(&mut tribes, name);
        }
        let sex = person.and_then(|name| links.sex_of(name));
        let mut row = line(
            *tick,
            Source::Headline,
            "headline",
            headline_category(text),
            "",
            text,
            headline_fp(text),
            tribes,
            sex,
        );
        let twin = candidates
            .iter()
            .find(|(i, e)| !told[*i] && e.tick == row.tick && same_fact(e, &row));
        if let Some((i, e)) = twin {
            told[*i] = true;
            #[cfg(test)]
            if normalized(&e.text) != normalized(&row.text) {
                OTHER_WORDS_TWINS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            }
            row.kind = e.kind.clone();
            row.actor = e.actor.clone();
            row.category = e.category;
            row.sex = e.sex.or(row.sex);
            for (id, name) in &e.tribes {
                if !row.tribes.iter().any(|(t, _)| t == id) {
                    row.tribes.push((id.clone(), name.clone()));
                }
            }
        }
        out.push(row);
    }
    out.extend(candidates.into_iter().filter(|(i, _)| !told[*i]).map(|(_, e)| e));
    for s in &stories {
        let mut tribes = Vec::new();
        links.add_lineage(&mut tribes, &s.lineage_id);
        out.push(line(
            s.tick,
            Source::Story,
            "story",
            Category::Milestones,
            &s.org_name,
            &s.story,
            story_fp(s),
            tribes,
            None,
        ));
    }
    out
}

/// Events folded into a headline that told them in other words (for the measurement in tests.rs).
#[cfg(test)]
pub(crate) static OTHER_WORDS_TWINS: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

/// Whether an event and a headline of the same tick tell one fact: the same
/// text, or the same heading about the same tribes sharing a word that is not
/// a tribe's name ("longhouse … ruined by flooding" and "🔥 A longhouse of the
/// Mufos fell to flooding."), or a pair the sim always writes together.
pub(crate) fn same_fact(event: &Row, headline: &Row) -> bool {
    if normalized(&event.text) == normalized(&headline.text) {
        return true;
    }
    if event.category != headline.category {
        return false;
    }
    fn ids(r: &Row) -> Vec<&str> {
        let mut v: Vec<&str> = r.tribes.iter().map(|(id, _)| id.as_str()).collect();
        v.sort_unstable();
        v
    }
    if ids(event) != ids(headline) {
        return false;
    }
    if event.text.starts_with("found refuge among") && headline.text.starts_with('\u{1F3D5}') {
        return true;
    }
    let names: HashSet<String> = event
        .tribes
        .iter()
        .chain(&headline.tribes)
        .map(|(_, name)| name.to_lowercase())
        .collect();
    let words = |text: &str| -> HashSet<String> {
        text.split(|c: char| !c.is_alphabetic())
            .filter(|w| w.chars().count() >= 4)
            .map(str::to_lowercase)
            .filter(|w| !STOPWORDS.contains(&w.as_str()) && !names.contains(w))
            .collect()
    };
    let a = words(&event.text);
    words(&headline.text).iter().any(|w| a.contains(w))
}

const STOPWORDS: [&str; 16] = [
    "the", "their", "they", "them", "with", "from", "into", "have", "were", "that", "this", "after", "over",
    "among", "tribe", "people",
];

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
            sex: None,
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

/// The person a headline starts with: "Daki became an elder…", "Daki is
/// gone.", "👑 Ramona of the Mufos seized power…", "⚖️ Dijena of Kefe was caught…".
fn person_of_headline(text: &str) -> Option<&str> {
    let text = text.trim_start_matches(|c: char| !c.is_alphanumeric());
    let (name, rest) = text.split_once(' ')?;
    let person = name.len() > 1
        && name.as_bytes()[0].is_ascii_uppercase()
        && name.bytes().skip(1).all(|b| b.is_ascii_lowercase())
        && !matches!(name, "The" | "Year" | "Machines");
    (person && !rest.is_empty()).then_some(name)
}

/// The lines whose tribe is the tribe of the person they start with.
fn names_its_person_first(text: &str) -> bool {
    text.contains(" became an elder") || text.contains(" is gone.")
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

    /// A person by name, the living first. A walk over the people, but only
    /// for the few lines a tick writes about someone.
    fn person(&self, name: &str) -> Option<&'a sim_core::organism::organism::Organism> {
        let sim = self.sim;
        sim.organisms
            .iter()
            .find(|o| o.alive && o.name == name)
            .or_else(|| sim.organisms.iter().rev().find(|o| !o.alive && o.name == name))
    }

    fn sex_of(&self, name: &str) -> Option<&'static str> {
        self.person(name).map(|o| o.sex.as_str())
    }

    /// The tribe of a person by name; their sex, if they were found.
    fn add_person(&mut self, out: &mut Vec<(String, String)>, name: &str) -> Option<&'static str> {
        let o = self.person(name)?;
        self.add_lineage(out, &o.lineage_id);
        Some(o.sex.as_str())
    }

    /// The actor of an event: a tribe by name or id, a battle ("battle_3120_<a>_<b>"), or a person
    /// (whose sex it returns).
    fn add_actor(&mut self, out: &mut Vec<(String, String)>, actor: &str) -> Option<&'static str> {
        let actor = actor.strip_prefix("the ").unwrap_or(actor);
        if actor.is_empty() {
            return None;
        }
        if let Some(lid) = self.by_name().get(actor).copied() {
            self.add_lineage(out, lid);
            return None;
        }
        if self.sim.lineage_names.contains_key(actor) {
            self.add_lineage(out, actor);
            return None;
        }
        if actor.starts_with("battle_") {
            for part in actor.split('_') {
                if self.sim.lineage_names.contains_key(part) {
                    self.add_lineage(out, part);
                }
            }
            return None;
        }
        self.add_person(out, actor)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn row(source: Source, kind: &str, category: Category, text: &str, tribes: &[&str]) -> Row {
        Row {
            tick: 7,
            source,
            kind: kind.to_string(),
            category,
            actor: String::new(),
            text: text.to_string(),
            era: String::new(),
            restored: false,
            fp: 0,
            tribes: tribes
                .iter()
                .map(|t| (t.to_string(), "Mufos".to_string()))
                .collect(),
            sex: None,
        }
    }

    #[test]
    fn an_event_and_a_headline_of_one_fact_are_one_line() {
        use Category::*;
        let e = |kind, cat, text, tribes: &[&str]| row(Source::Event, kind, cat, text, tribes);
        let h = |cat, text, tribes: &[&str]| row(Source::Headline, "headline", cat, text, tribes);
        // A ruin, in other words.
        assert!(same_fact(
            &e(
                "building_ruined",
                Disaster,
                "longhouse at (3,4) was ruined by flooding",
                &["a1"]
            ),
            &h(
                Disaster,
                "\u{1F525} A longhouse of the Mufos fell to flooding.",
                &["a1"]
            ),
        ));
        // A sickness.
        assert!(same_fact(
            &e("outbreak", Disaster, "influenza spreads", &["a1"]),
            &h(Disaster, "\u{1F912} Influenza spreads among the Mufos.", &["a1"]),
        ));
        // The last of a tribe taken in.
        assert!(same_fact(
            &e("milestone", Tribes, "found refuge among the Kefe", &["a1", "b2"]),
            &h(
                Tribes,
                "\u{1F3D5}\u{FE0F} The last 3 of the Mufos were taken in by the Kefe.",
                &["b2", "a1"]
            ),
        ));
        // Another tribe's ruin, or another kind of news about the same tribe, stays apart.
        assert!(!same_fact(
            &e(
                "building_ruined",
                Disaster,
                "longhouse at (3,4) was ruined by flooding",
                &["b2"]
            ),
            &h(
                Disaster,
                "\u{1F525} A longhouse of the Mufos fell to flooding.",
                &["a1"]
            ),
        ));
        assert!(!same_fact(
            &e(
                "building_ruined",
                Disaster,
                "hut at (3,4) was ruined by fire",
                &["a1"]
            ),
            &h(Disaster, "\u{1F912} Influenza spreads among the Mufos.", &["a1"]),
        ));
        assert!(!same_fact(
            &e(
                "war_declared",
                War,
                "a1 declared war on b2 over the border at (1,2)",
                &["a1", "b2"]
            ),
            &h(
                War,
                "\u{2694}\u{FE0F} The Mufos conquered 5 tiles of Kefe land.",
                &["a1", "b2"]
            ),
        ));
    }

    #[test]
    fn a_headline_starts_with_its_person() {
        assert_eq!(
            person_of_headline("Daki became an elder, carrying: \"x\""),
            Some("Daki")
        );
        assert_eq!(
            person_of_headline("\u{1F451} Ramona of the Mufos seized power in a coup."),
            Some("Ramona")
        );
        assert_eq!(
            person_of_headline("\u{1F525} A hut of the Mufos fell to fire."),
            None
        );
        assert_eq!(person_of_headline("\u{1F4C5} Year 3 begins."), None);
    }
}
