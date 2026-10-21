import type { SimTable } from './types'

// Kinds of religion (`ReligionKind::name`) and the names a faith is founded
// under (`RELIGION_NAMES`), both in crates/sim-core/src/sim/civ/society/culture.rs.
// The names are translated for their meaning and written as Russian proper
// names: a capital on the first word, and on a word that names a deity.
// A faith founded under a name already taken gets its id appended
// ("Sun Path rel7"); such a name is not in this table and is shown as sent.
export const religion: SimTable = {
  animism: { ru: 'анимизм' },
  polytheism: { ru: 'многобожие' },
  monotheism: { ru: 'единобожие' },
  philosophical: { ru: 'философское учение' },
  secular: { ru: 'светское учение' },

  'Sun Path': { ru: 'Путь Солнца' },
  'Sky Mother': { ru: 'Небесная Мать' },
  'Hearth Faith': { ru: 'Вера очага' },
  'Stone Pact': { ru: 'Каменный завет' },
  'River Way': { ru: 'Речной путь' },
  'Forest Whisper': { ru: 'Шёпот леса' },
  'Eternal Flame': { ru: 'Вечное пламя' },
  'Old Song': { ru: 'Старая песнь' },
  'First Word': { ru: 'Первое слово' },
  'Long Road': { ru: 'Долгая дорога' },
  'Bright Star': { ru: 'Светлая звезда' },
  'Deep Water': { ru: 'Глубокие воды' },
  'Iron Truth': { ru: 'Железная истина' },
  'Wind Order': { ru: 'Орден ветра' },
  'Bone Wisdom': { ru: 'Мудрость костей' },
  'Moon Vow': { ru: 'Лунный обет' },
}
