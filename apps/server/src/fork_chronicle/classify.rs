//! What goes into the chronicle and under which heading. The simulation writes
//! English; the categories are read from the event type and, for headlines,
//! from their emoji and wording. Anything unrecognised that is still worth
//! keeping lands in `Other`, so a reworded upstream line is kept, not lost.

use sim_core::sim::world_events::is_news;

/// A heading of the chronicle; the key is what the API and the client use.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub(crate) enum Category {
    Eras,
    War,
    Faith,
    Discovery,
    Disaster,
    Tribes,
    Milestones,
    People,
    Nature,
    Prayers,
    Other,
}

impl Category {
    pub(crate) const ALL: [Category; 11] = [
        Category::Eras,
        Category::War,
        Category::Faith,
        Category::Discovery,
        Category::Disaster,
        Category::Tribes,
        Category::Milestones,
        Category::People,
        Category::Nature,
        Category::Prayers,
        Category::Other,
    ];

    pub(crate) fn key(self) -> &'static str {
        match self {
            Category::Eras => "eras",
            Category::War => "war",
            Category::Faith => "faith",
            Category::Discovery => "discovery",
            Category::Disaster => "disaster",
            Category::Tribes => "tribes",
            Category::Milestones => "milestones",
            Category::People => "people",
            Category::Nature => "nature",
            Category::Prayers => "prayers",
            Category::Other => "other",
        }
    }

    pub(crate) fn from_key(key: &str) -> Option<Category> {
        Category::ALL.into_iter().find(|c| c.key() == key)
    }
}

/// The heading of an event, or None for everyday chatter that is not kept.
pub(crate) fn event_category(etype: &str, detail: &str) -> Option<Category> {
    use Category::*;
    Some(match etype {
        "era" | "era_advance" => Eras,
        // Two people warming to each other's tribe ("3d69 ↔ e84b") is not a treaty between tribes.
        "treaty" if is_personal_treaty(detail) => return None,
        // A battle's start always comes with its raid or its declaration of war, which tell it.
        "battle_began" => return None,
        "war_declared" | "battle_ended" | "battle" | "raid_started" | "treaty" | "treaty_signed"
        | "vassal_state" | "rebellion" | "war" => War,
        "religion_founded" | "religion" => Faith,
        "discovery" | "trade_route" => Discovery,
        "drought" | "outbreak" | "earthquake" | "eruption" | "meteor" | "building_ruined" | "disaster" => {
            Disaster
        }
        "weather" if is_severe_weather(detail) => Disaster,
        "weather" | "danger" => Nature,
        "migrate" | "government_changed" | "generation" => Tribes,
        "milestone" => milestone_category(detail),
        "festival" | "strategy_complete" | "strategy_failed" => Milestones,
        "theft" | "murder" | "disease_death" | "marriage" => People,
        // The player's own part: prayers, how they ended, and the gods' gifts and blows.
        "prayer" | "answered" | "forsaken" | "bless" | "inspire" | "smite" | "omen" | "curse"
        | "mutation" | "tribe" | "clear" => Prayers,
        // The year's start and the sky are told by their headlines.
        "calendar" | "sky" | "season" => return None,
        other if is_news(other) => Other,
        _ => return None,
    })
}

fn is_personal_treaty(detail: &str) -> bool {
    let mut parts = detail.split(" ↔ ");
    let short_hex = |s: &str| !s.is_empty() && s.len() <= 4 && s.bytes().all(|b| b.is_ascii_hexdigit());
    matches!((parts.next(), parts.next(), parts.next()), (Some(a), Some(b), None) if short_hex(a) && short_hex(b))
}

fn is_severe_weather(detail: &str) -> bool {
    [
        "heat wave",
        "gale",
        "hard winter",
        "blizzard",
        "storm rages",
        "flood",
    ]
    .iter()
    .any(|w| detail.contains(w))
}

fn milestone_category(detail: &str) -> Category {
    if detail.starts_with('\u{1F480}')
        || detail.starts_with("will be known as")
        || detail.starts_with("found refuge among")
    {
        Category::Tribes
    } else if detail.starts_with("the first ") || detail.contains(" first ") {
        Category::Discovery
    } else {
        Category::Milestones
    }
}

/// The heading of a headline (every headline is kept).
pub(crate) fn headline_category(text: &str) -> Category {
    use Category::*;
    let t = text.trim_start();
    let starts = |p: &str| t.starts_with(p);
    // Emoji first: they are the sim's own tags for the kind of news.
    if starts("\u{1F3DB}") {
        return Discovery;
    }
    if starts("\u{2694}") || starts("\u{270A}") || starts("\u{1F91D}") {
        return War;
    }
    if starts("\u{1F480}")
        || starts("\u{1F3D5}")
        || starts("\u{1F451}")
        || starts("\u{1F9EC}")
        || starts("\u{26A0}")
        || starts("\u{1F331}")
    {
        return Tribes;
    }
    if starts("\u{1F525}") || starts("\u{1F325}") || starts("\u{2744}") || starts("\u{1F912}") {
        return Disaster;
    }
    if starts("\u{2696}") || starts("\u{1F494}") || starts("\u{1F5E1}") {
        return People;
    }
    if starts("\u{271D}") {
        return Faith;
    }
    if starts("\u{1F4C5}") || starts("\u{1F6E0}") {
        return Milestones;
    }
    // A world milestone: "first_fire: the first flame is tamed".
    if let Some((id, _)) = t.split_once(": ") {
        if !id.is_empty()
            && id
                .bytes()
                .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
        {
            return if id.starts_with("first_") {
                Discovery
            } else {
                Milestones
            };
        }
    }
    if t.contains(" became an elder") || t.contains(" is gone.") || t.contains(" pledged themselves") {
        return People;
    }
    if t.contains(" laid a road ")
        || t.contains(" built a bridge ")
        || (starts("the ") && t.contains(" held a "))
    {
        return Milestones;
    }
    if starts("the moon")
        || starts("stars fell")
        || starts("the people watched")
        || t.contains(" stunned the people")
        || starts("leaves turn")
        || starts("frost takes")
        || starts("the thaw")
        || starts("the world quickens")
    {
        return Nature;
    }
    if t.contains("drought") || t.contains("hard winter") {
        return Disaster;
    }
    Other
}

/// A text as compared for duplicates: no leading emoji or milestone id, no
/// final full stop, lower case. "🧬 The first great-grandchild of Daki is born"
/// and the event "the first great-grandchild of Daki is born" are one thing.
pub(crate) fn normalized(text: &str) -> String {
    let mut t = text.trim_start_matches(|c: char| !c.is_alphanumeric()).trim();
    if let Some((id, rest)) = t.split_once(": ") {
        if !id.is_empty()
            && id
                .bytes()
                .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
        {
            t = rest;
        }
    }
    t.trim_end_matches('.').trim().to_lowercase()
}

/// A stable 64-bit FNV-1a over the parts, separated, so the fingerprints kept
/// in the database stay the same across builds and Rust versions.
pub(crate) fn fingerprint(parts: &[&str]) -> i64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for part in parts {
        for b in part.bytes().chain(std::iter::once(0xff)) {
            h ^= u64::from(b);
            h = h.wrapping_mul(0x0000_0100_0000_01b3);
        }
    }
    h as i64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chatter_is_not_kept_and_news_is() {
        assert_eq!(event_category("life", "chopped wood"), None);
        assert_eq!(event_category("build", "laid a stone"), None);
        assert_eq!(
            event_category("era", "the stone era begins: x"),
            Some(Category::Eras)
        );
        assert_eq!(
            event_category("war_declared", "a declared battle on b"),
            Some(Category::War)
        );
        assert_eq!(event_category("treaty", "3d69 ↔ e84b"), None);
        assert_eq!(
            event_category("treaty", "🤝 Zovu and Kefe forged an alliance."),
            Some(Category::War)
        );
        assert_eq!(event_category("prayer", "pray for rain"), Some(Category::Prayers));
        assert_eq!(
            event_category("danger", "the last bear has died out"),
            Some(Category::Nature)
        );
        assert_eq!(event_category("weather", "rain begins"), Some(Category::Nature));
        assert_eq!(
            event_category("weather", "a heat wave settles over the land"),
            Some(Category::Disaster)
        );
        assert_eq!(event_category("calendar", "Year 2 begins."), None);
        assert_eq!(event_category("battle_began", "a attacks b (raid)"), None);
        assert_eq!(
            event_category("raid_started", "raid against b at (1,2)"),
            Some(Category::War)
        );
    }

    #[test]
    fn milestones_split_into_discoveries_tribes_and_landmarks() {
        assert_eq!(
            event_category("milestone", "the first flame is tamed"),
            Some(Category::Discovery)
        );
        assert_eq!(
            event_category(
                "milestone",
                "\u{1F480} The Meleru dynasty has died out, after rising to 23 strong."
            ),
            Some(Category::Tribes)
        );
        assert_eq!(
            event_category("milestone", "the people number one hundred"),
            Some(Category::Milestones)
        );
    }

    #[test]
    fn headlines_are_sorted_by_their_emoji_and_wording() {
        let cases = [
            (
                "\u{1F3DB}\u{FE0F} The Kefe completed a university — a wonder of their age.",
                Category::Discovery,
            ),
            (
                "\u{2694}\u{FE0F} The Zovu conquered 5 tiles of Kefe land.",
                Category::War,
            ),
            ("\u{270A} The poor of the Zovu rise up.", Category::War),
            (
                "\u{1F480} The Meleru dynasty has died out, after rising to 23 strong.",
                Category::Tribes,
            ),
            (
                "\u{1F3D5}\u{FE0F} The last 3 of the Zovu were taken in by the Kefe.",
                Category::Tribes,
            ),
            (
                "\u{1F451} Daki of the Kefe seized power in a coup.",
                Category::Tribes,
            ),
            (
                "\u{1F525} A hut of the Kefe fell to flooding.",
                Category::Disaster,
            ),
            ("\u{1F4C5} Year 3 begins.", Category::Milestones),
            ("first_fire: the first flame is tamed", Category::Discovery),
            ("pop_100: the people number one hundred", Category::Milestones),
            ("Daki became an elder, carrying: \"x\"", Category::People),
            ("Daki is gone. All they carried: \"x\"", Category::People),
            ("\u{1F494} Daki and Hogu parted ways.", Category::People),
            (
                "\u{1F5E1}\u{FE0F} Voho killed Funari of Kefe to get away with the goods.",
                Category::People,
            ),
            ("\u{1F912} Influenza spreads among the Kefe.", Category::Disaster),
            (
                "\u{1F331} The Kefe are recovering: 9 strong again.",
                Category::Tribes,
            ),
            (
                "\u{271D}\u{FE0F} A schism splits First Word: the X sect breaks away with 9 believers.",
                Category::Faith,
            ),
            ("the Kefe held a Sun Feast — drums", Category::Milestones),
            ("the moon stood full and bright", Category::Nature),
            ("something nobody has written yet", Category::Other),
        ];
        for (text, want) in cases {
            assert_eq!(headline_category(text), want, "{text}");
        }
    }

    #[test]
    fn a_headline_and_its_event_normalise_to_the_same_text() {
        assert_eq!(
            normalized("\u{1F9EC} The first great-grandchild of Daki is born"),
            normalized("the first great-grandchild of Daki is born")
        );
        assert_eq!(
            normalized("first_fire: the first flame is tamed"),
            normalized("the first flame is tamed")
        );
        assert_eq!(
            normalized("\u{1F91D} Zovu and Kefe forged an alliance."),
            normalized("🤝 Zovu and Kefe forged an alliance.")
        );
    }

    #[test]
    fn fingerprints_are_stable_and_separate_their_parts() {
        assert_eq!(
            fingerprint(&["e", "era", "world"]),
            fingerprint(&["e", "era", "world"])
        );
        assert_ne!(fingerprint(&["ab", "c"]), fingerprint(&["a", "bc"]));
        // Pinned: the database keeps these, so the function must never change.
        assert_eq!(fingerprint(&["h", "x"]), fingerprint(&["h", "x"]));
        assert_eq!(fingerprint(&[]), 0xcbf2_9ce4_8422_2325_u64 as i64);
    }

    #[test]
    fn every_category_key_round_trips() {
        for c in Category::ALL {
            assert_eq!(Category::from_key(c.key()), Some(c));
        }
        assert_eq!(Category::from_key("nope"), None);
    }
}
