import { defineMessages } from '../define'

/**
 * The Civilization window: the calendar strip, the lineage table, the campaigns a player can set
 * for a tribe (shown to the player as a «курс»), and the sections on government, faith, war,
 * building, farming, goods, books, art, trade and headlines.
 */
export const civ = defineMessages(
  {
    // The calendar strip at the top.
    // The lineage table. Phones show the headers again beside each cell (an 82px column).
    // Campaigns ("guidance"): a soft goal the player sets for a tribe.
    'civ.topic.history': 'history',
    'civ.topic.philosophy': 'philosophy',
    'civ.topic.science': 'science',
    'civ.topic.medicine': 'medicine',
    'civ.topic.religion': 'religion',
    'civ.topic.poetry': 'poetry',
    'civ.topic.law': 'law',
    'civ.topic.engineering': 'engineering',
    'civ.topic.geography': 'geography',
    'civ.topic.mathematics': 'mathematics',
    'civ.topic.astronomy': 'astronomy',
    'civ.topic.fiction': 'fiction',
    'civ.topic.biography': 'biography',
    'civ.topic.economics': 'economics',
    'civ.topic.drama': 'drama',
    // Battle sizes as the simulation sends them (the Rust enum names).
    'civ.scale.Skirmish': 'Skirmish',
    'civ.scale.Raid': 'Raid',
    'civ.scale.Siege': 'Siege',
    'civ.scale.Battle': 'Battle',
    'civ.scale.War': 'War',
  },
  {
    'civ.topic.history': 'история',
    'civ.topic.philosophy': 'философия',
    'civ.topic.science': 'наука',
    'civ.topic.medicine': 'медицина',
    'civ.topic.religion': 'религия',
    'civ.topic.poetry': 'поэзия',
    'civ.topic.law': 'право',
    'civ.topic.engineering': 'инженерное дело',
    'civ.topic.geography': 'география',
    'civ.topic.mathematics': 'математика',
    'civ.topic.astronomy': 'астрономия',
    'civ.topic.fiction': 'проза',
    'civ.topic.biography': 'жизнеописание',
    'civ.topic.economics': 'хозяйство',
    'civ.topic.drama': 'драма',
    // Battle sizes as the simulation sends them (the Rust enum names).
    'civ.scale.Skirmish': 'Стычка',
    'civ.scale.Raid': 'Набег',
    'civ.scale.Siege': 'Осада',
    'civ.scale.Battle': 'Битва',
    'civ.scale.War': 'Война',
  },
)
