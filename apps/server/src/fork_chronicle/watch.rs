//! "Don't miss what matters": the chronicle stops or slows the world itself, in
//! the tick that wrote the line, when something the player asked to see
//! happens while time runs faster than 1x. After a stop, the next one waits
//! until the world has run fast again for the debounce time; what matters in
//! the meantime is kept and comes with the next card ("Also meanwhile").
//! The player's choices live in the client (fork/chronicle/watch.ts), which
//! sends them with `POST /chronicle/watch`; until it does, the defaults hold.

use std::collections::VecDeque;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use super::capture::Row;
use super::classify::Category;
use super::store::TribeLink;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum Action {
    Ignore,
    Slow,
    Pause,
}

/// The rules, in the order the settings show them, with their defaults.
pub(crate) const RULES: [(&str, Action); 12] = [
    ("world_era", Action::Pause),
    ("focus_era", Action::Pause),
    ("tribe_era", Action::Ignore),
    ("died_out", Action::Pause),
    ("split", Action::Slow),
    ("war", Action::Slow),
    ("uprising", Action::Slow),
    ("wonder", Action::Slow),
    ("disaster", Action::Slow),
    ("epidemic", Action::Ignore),
    ("battles", Action::Ignore),
    ("faith", Action::Ignore),
];

pub(crate) const DEBOUNCE_CHOICES: [u64; 3] = [30, 60, 180];
const DEFAULT_DEBOUNCE: u64 = 60;
/// Alerts kept for the client to fetch.
const KEEP_ALERTS: usize = 20;
/// Lines shown under "Also meanwhile", and held back at most.
const KEEP_ALSO: usize = 12;
const KEEP_DEFERRED: usize = 64;

fn rule_index(rule: &str) -> Option<usize> {
    RULES.iter().position(|(r, _)| *r == rule)
}

/// Which rule a line falls under, if any. `focus` is the tribe the player has selected.
pub(crate) fn rule_of(row: &Row, focus: Option<&str>) -> Option<&'static str> {
    let text = row.text.trim_start();
    let kind = row.kind.as_str();
    let natural = matches!(row.actor.as_str(), "world" | "the world" | "");
    Some(match kind {
        "era" => "world_era",
        "era_advance" if focus.is_some_and(|f| row.tribes.iter().any(|(id, _)| id == f)) => "focus_era",
        "era_advance" => "tribe_era",
        "migrate" if text.contains("breaks off to found") => "split",
        "war_declared" => "war",
        "rebellion" | "murder" => "uprising",
        "milestone" if row.category == Category::Discovery => "wonder",
        "drought" if text.starts_with("drought begins") => "disaster",
        "earthquake" | "eruption" if natural => "disaster",
        "outbreak" => "epidemic",
        "battle_ended" | "treaty" | "treaty_signed" | "vassal_state" | "raid_started" => "battles",
        "religion_founded" => "faith",
        _ if text.starts_with('\u{1F480}') => "died_out",
        _ if text.starts_with("\u{1F3DB}") => "wonder",
        _ if text.starts_with('\u{1F912}') => "epidemic",
        _ if text.starts_with('\u{2694}') => "battles",
        _ if text.starts_with('\u{271D}') => "faith",
        _ => return None,
    })
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub(crate) struct WatchConfig {
    pub enabled: bool,
    pub debounce_secs: u64,
    pub rules: std::collections::BTreeMap<String, Action>,
    pub focus: Option<String>,
}

impl Default for WatchConfig {
    fn default() -> Self {
        WatchConfig {
            enabled: true,
            debounce_secs: DEFAULT_DEBOUNCE,
            rules: RULES.iter().map(|(r, a)| (r.to_string(), *a)).collect(),
            focus: None,
        }
    }
}

impl WatchConfig {
    fn action(&self, rule: &str) -> Action {
        self.rules.get(rule).copied().unwrap_or(Action::Ignore)
    }
}

/// What the client may change; absent fields stay as they are.
#[derive(Deserialize, Debug, Default)]
pub(crate) struct WatchUpdate {
    pub enabled: Option<bool>,
    pub debounce_secs: Option<u64>,
    pub rules: Option<std::collections::BTreeMap<String, Action>>,
    /// `null` clears the focus; absent leaves it.
    #[serde(default, deserialize_with = "some_or_null")]
    pub focus: Option<Option<String>>,
}

fn some_or_null<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<Option<String>>, D::Error> {
    Ok(Some(Option::<String>::deserialize(d)?))
}

/// A line as an alert carries it (the same fields as a page of the chronicle).
#[derive(Clone, Debug, PartialEq, Serialize)]
pub(crate) struct AlertLine {
    pub tick: u64,
    pub src: &'static str,
    pub kind: String,
    pub cat: &'static str,
    pub actor: String,
    pub text: String,
    pub era: String,
    pub tribes: Vec<TribeLink>,
    pub rule: &'static str,
}

impl AlertLine {
    fn of(row: &Row, rule: &'static str) -> Self {
        AlertLine {
            tick: row.tick,
            src: row.source.key(),
            kind: row.kind.clone(),
            cat: row.category.key(),
            actor: row.actor.clone(),
            text: row.text.clone(),
            era: row.era.clone(),
            tribes: row
                .tribes
                .iter()
                .map(|(id, name)| TribeLink {
                    id: id.clone(),
                    name: name.clone(),
                })
                .collect(),
            rule,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub(crate) struct Alert {
    pub id: u64,
    pub tick: u64,
    pub action: Action,
    /// The speed the world ran at, for "Continue at N×".
    pub prev_speed: f64,
    pub main: AlertLine,
    pub also: Vec<AlertLine>,
    /// All the lines held back, when more than `also` shows.
    pub also_total: usize,
    /// The tribe "Show" goes to; for a new world era, the first tribe that reached it.
    pub focus: Option<TribeLink>,
}

/// The runtime as the watch sees it.
#[derive(Clone, Copy, Debug)]
pub(crate) struct Pace {
    pub paused: bool,
    pub speed: f64,
}

impl Pace {
    fn fast(self) -> bool {
        !self.paused && self.speed > 1.0 + 1e-6
    }
}

#[derive(Default)]
pub(crate) struct Watch {
    pub config: WatchConfig,
    alerts: VecDeque<Alert>,
    next_id: u64,
    /// The last stop not yet followed by fast time again.
    open_stop: bool,
    /// When time ran fast again after the last stop: the debounce counts from here.
    resumed_at: Option<Instant>,
    /// What mattered while the debounce held stops back, oldest first.
    deferred: Vec<(Action, AlertLine)>,
}

impl Watch {
    pub(crate) fn update(&mut self, update: WatchUpdate) {
        if let Some(enabled) = update.enabled {
            self.config.enabled = enabled;
            if !enabled {
                self.deferred.clear();
            }
        }
        if let Some(secs) = update.debounce_secs {
            if DEBOUNCE_CHOICES.contains(&secs) {
                self.config.debounce_secs = secs;
            }
        }
        if let Some(rules) = update.rules {
            for (rule, action) in rules {
                if let Some(i) = rule_index(&rule) {
                    self.config.rules.insert(RULES[i].0.to_string(), action);
                }
            }
        }
        if let Some(focus) = update.focus {
            self.config.focus = focus.filter(|f| !f.is_empty());
        }
    }

    pub(crate) fn alerts_after(&self, after: u64) -> Vec<Alert> {
        self.alerts.iter().filter(|a| a.id > after).cloned().collect()
    }

    pub(crate) fn latest_id(&self) -> u64 {
        self.alerts.back().map_or(0, |a| a.id)
    }

    /// Looks at what one capture found. Returns the alert to raise (the
    /// caller pauses or slows the world and ends the batch), if any.
    /// `first_into` names the first tribe that reached a world era.
    pub(crate) fn consider(
        &mut self,
        rows: &[Row],
        pace: Pace,
        now: Instant,
        first_into: impl Fn(&str) -> Option<TribeLink>,
    ) -> Option<Alert> {
        if !self.config.enabled {
            return None;
        }
        if self.open_stop && pace.fast() {
            // The player let time run fast again: the debounce starts now.
            self.open_stop = false;
            self.resumed_at = Some(now);
        }
        let focus = self.config.focus.clone();
        let mut found: Vec<(Action, AlertLine)> = rows
            .iter()
            .filter(|r| !r.restored)
            .filter_map(|r| {
                let rule = rule_of(r, focus.as_deref())?;
                let action = self.config.action(rule);
                (action != Action::Ignore).then(|| (action, AlertLine::of(r, rule)))
            })
            .collect();
        // At 1x or on pause the player is watching anyway.
        if !pace.fast() {
            return None;
        }
        let debounce = Duration::from_secs(self.config.debounce_secs);
        if self.open_stop || self.resumed_at.is_some_and(|at| now < at + debounce) {
            self.deferred.append(&mut found);
            let excess = self.deferred.len().saturating_sub(KEEP_DEFERRED);
            self.deferred.drain(..excess);
            return None;
        }
        let mut all = std::mem::take(&mut self.deferred);
        all.append(&mut found);
        if all.is_empty() {
            return None;
        }
        // The biggest thing leads; between equals, the newest.
        let lead = (0..all.len()).max_by_key(|&i| (all[i].0, i)).expect("not empty");
        let (action, main) = all.remove(lead);
        let also_total = all.len();
        let also: Vec<AlertLine> = all.into_iter().rev().take(KEEP_ALSO).map(|(_, l)| l).collect();
        let focus = if main.kind == "era" {
            era_of_world_line(&main.text).and_then(&first_into)
        } else {
            None
        }
        .or_else(|| main.tribes.first().cloned());
        self.next_id += 1;
        let alert = Alert {
            id: self.next_id,
            tick: main.tick,
            action,
            prev_speed: pace.speed,
            main,
            also,
            also_total,
            focus,
        };
        self.alerts.push_back(alert.clone());
        while self.alerts.len() > KEEP_ALERTS {
            self.alerts.pop_front();
        }
        self.open_stop = true;
        self.resumed_at = None;
        Some(alert)
    }
}

/// "the bronze era begins: …" → "bronze".
fn era_of_world_line(text: &str) -> Option<&str> {
    text.strip_prefix("the ")?
        .split_once(" era begins")
        .map(|(era, _)| era)
}

/// "Kefe entered the bronze era: …" → "bronze".
pub(crate) fn era_of_tribe_line(text: &str) -> Option<&str> {
    let (_, rest) = text.split_once(" entered the ")?;
    rest.split_once(" era").map(|(era, _)| era)
}

#[cfg(test)]
mod tests {
    use super::super::capture::Source;
    use super::*;

    fn row(tick: u64, kind: &str, cat: Category, text: &str, tribes: &[(&str, &str)]) -> Row {
        Row {
            tick,
            source: Source::Event,
            kind: kind.to_string(),
            category: cat,
            actor: "world".to_string(),
            text: text.to_string(),
            era: "iron".to_string(),
            restored: false,
            fp: 0,
            tribes: tribes
                .iter()
                .map(|(a, b)| (a.to_string(), b.to_string()))
                .collect(),
        }
    }

    fn world_era(tick: u64) -> Row {
        row(
            tick,
            "era",
            Category::Eras,
            "the bronze era begins: Metal is smelted.",
            &[],
        )
    }

    fn war(tick: u64) -> Row {
        row(
            tick,
            "war_declared",
            Category::War,
            "aaaa1111 declared war on bbbb2222 over the border at (1,2)",
            &[("aaaa1111", "Zovu"), ("bbbb2222", "Kefe")],
        )
    }

    const FAST: Pace = Pace {
        paused: false,
        speed: 50.0,
    };
    const ONE: Pace = Pace {
        paused: false,
        speed: 1.0,
    };
    const PAUSED: Pace = Pace {
        paused: true,
        speed: 50.0,
    };

    fn first(_: &str) -> Option<TribeLink> {
        Some(TribeLink {
            id: "cccc3333".into(),
            name: "Hassa".into(),
        })
    }

    #[test]
    fn the_rules_sort_lines_as_the_settings_name_them() {
        let focus = Some("aaaa1111");
        let advance = |tribe: &str| {
            row(
                1,
                "era_advance",
                Category::Eras,
                "Zovu entered the iron era: x",
                &[(tribe, "Zovu")],
            )
        };
        assert_eq!(rule_of(&world_era(1), focus), Some("world_era"));
        assert_eq!(rule_of(&advance("aaaa1111"), focus), Some("focus_era"));
        assert_eq!(rule_of(&advance("bbbb2222"), focus), Some("tribe_era"));
        assert_eq!(rule_of(&war(1), focus), Some("war"));
        let dynasty = row(
            1,
            "milestone",
            Category::Tribes,
            "\u{1F480} The Meleru dynasty has died out, after rising to 23 strong.",
            &[],
        );
        assert_eq!(rule_of(&dynasty, focus), Some("died_out"));
        let split = row(
            1,
            "migrate",
            Category::Tribes,
            "breaks off to found the Vagir",
            &[],
        );
        assert_eq!(rule_of(&split, focus), Some("split"));
        let arrive = row(
            1,
            "migrate",
            Category::Tribes,
            "a wandering tribe arrives (5 souls)",
            &[],
        );
        assert_eq!(rule_of(&arrive, focus), None);
        let first_fire = row(
            1,
            "milestone",
            Category::Discovery,
            "the first flame is tamed",
            &[],
        );
        assert_eq!(rule_of(&first_fire, focus), Some("wonder"));
        let mut quake = row(1, "earthquake", Category::Disaster, "the ground shook", &[]);
        assert_eq!(rule_of(&quake, focus), Some("disaster"));
        quake.actor = "the earth".into();
        assert_eq!(
            rule_of(&quake, focus),
            None,
            "the player's own earthquake is no news to them"
        );
        assert_eq!(
            rule_of(
                &row(1, "drought", Category::Disaster, "drought ends - 3 restored", &[]),
                focus
            ),
            None
        );
        assert_eq!(
            rule_of(&row(1, "headline", Category::Other, "nothing to see", &[]), focus),
            None
        );
    }

    #[test]
    fn a_pause_rule_stops_the_world_only_when_it_runs_fast() {
        let mut w = Watch::default();
        let now = Instant::now();
        assert!(w.consider(&[world_era(10)], ONE, now, first).is_none());
        assert!(w.consider(&[world_era(10)], PAUSED, now, first).is_none());
        let alert = w.consider(&[world_era(11)], FAST, now, first).expect("a stop");
        assert_eq!(alert.action, Action::Pause);
        assert_eq!(alert.prev_speed, 50.0);
        assert_eq!(alert.focus.as_ref().map(|t| t.name.as_str()), Some("Hassa"));
        assert_eq!(w.alerts_after(0), vec![alert.clone()]);
        assert!(w.alerts_after(alert.id).is_empty());
    }

    #[test]
    fn one_tick_one_card_led_by_the_biggest_line() {
        let mut w = Watch::default();
        let alert = w
            .consider(&[war(5), world_era(5), war(5)], FAST, Instant::now(), first)
            .unwrap();
        assert_eq!(alert.action, Action::Pause, "a pause outranks a slow-down");
        assert_eq!(alert.main.rule, "world_era");
        assert_eq!(alert.also.len(), 2);
        assert_eq!(alert.also_total, 2);
        assert_eq!(w.alerts_after(0).len(), 1);
    }

    #[test]
    fn the_debounce_holds_stops_back_and_the_next_card_tells_what_was_missed() {
        let mut w = Watch::default();
        let t0 = Instant::now();
        let s = |n: u64| t0 + Duration::from_secs(n);
        assert!(w.consider(&[war(1)], FAST, t0, first).is_some());
        // The world is slowed: nothing more until it runs fast again...
        assert!(w.consider(&[war(2)], ONE, s(5), first).is_none());
        // ...and then for a minute.
        assert!(w.consider(&[], FAST, s(100), first).is_none());
        assert!(w.consider(&[war(3)], FAST, s(130), first).is_none());
        assert!(w.consider(&[world_era(4)], FAST, s(159), first).is_none());
        // The minute is over: one card, led by the pause, with what came meanwhile.
        let alert = w
            .consider(&[], FAST, s(161), first)
            .expect("the missed lines come now");
        assert_eq!(alert.action, Action::Pause);
        assert_eq!(alert.main.tick, 4);
        assert_eq!(alert.also.iter().map(|l| l.tick).collect::<Vec<_>>(), vec![3]);
    }

    #[test]
    fn the_debounce_follows_the_choice_and_off_means_off() {
        let mut w = Watch::default();
        w.update(WatchUpdate {
            debounce_secs: Some(30),
            ..Default::default()
        });
        let t0 = Instant::now();
        assert!(w.consider(&[war(1)], FAST, t0, first).is_some());
        assert!(w.consider(&[], FAST, t0, first).is_none());
        assert!(w
            .consider(&[war(2)], FAST, t0 + Duration::from_secs(29), first)
            .is_none());
        assert!(w
            .consider(&[], FAST, t0 + Duration::from_secs(31), first)
            .is_some());

        w.update(WatchUpdate {
            debounce_secs: Some(45),
            ..Default::default()
        });
        assert_eq!(w.config.debounce_secs, 30, "only 30 s, 1 min or 3 min");

        w.update(WatchUpdate {
            enabled: Some(false),
            ..Default::default()
        });
        assert!(w
            .consider(&[world_era(9)], FAST, t0 + Duration::from_secs(999), first)
            .is_none());
    }

    #[test]
    fn rules_and_focus_come_from_the_player() {
        let mut w = Watch::default();
        let update: WatchUpdate = serde_json::from_str(
            r#"{"rules":{"world_era":"ignore","war":"pause","bogus":"pause"},"focus":"aaaa1111"}"#,
        )
        .unwrap();
        w.update(update);
        assert_eq!(w.config.action("world_era"), Action::Ignore);
        assert_eq!(w.config.action("war"), Action::Pause);
        assert!(!w.config.rules.contains_key("bogus"));
        assert_eq!(w.config.focus.as_deref(), Some("aaaa1111"));
        assert!(w.consider(&[world_era(1)], FAST, Instant::now(), first).is_none());
        let alert = w.consider(&[war(2)], FAST, Instant::now(), first).unwrap();
        assert_eq!(alert.action, Action::Pause);
        assert_eq!(alert.focus.as_ref().map(|t| t.id.as_str()), Some("aaaa1111"));
        // Absent focus leaves it; null clears it.
        w.update(serde_json::from_str("{}").unwrap());
        assert_eq!(w.config.focus.as_deref(), Some("aaaa1111"));
        w.update(serde_json::from_str(r#"{"focus":null}"#).unwrap());
        assert_eq!(w.config.focus, None);
    }

    #[test]
    fn restored_lines_never_stop_the_world() {
        let mut w = Watch::default();
        let mut old = world_era(1);
        old.restored = true;
        assert!(w.consider(&[old], FAST, Instant::now(), first).is_none());
    }

    #[test]
    fn era_names_are_read_from_the_lines() {
        assert_eq!(era_of_world_line("the bronze era begins: x"), Some("bronze"));
        assert_eq!(era_of_tribe_line("Kefe entered the iron era: x"), Some("iron"));
        assert_eq!(era_of_tribe_line("nothing"), None);
    }
}
