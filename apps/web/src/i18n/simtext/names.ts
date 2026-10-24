// Names the simulation composes from parts rather than writes out: book titles
// (pick_book_title in sim/tech/language_tech.rs), artwork titles (tick_artwork
// in sim/civ/civ_tick/arts.rs) and faith names with an id appended
// (create_religion in sim/actions/religion_expanded/mod.rs). Each is taken
// apart and put together again in Russian.
import { SIM_TABLES } from '../sim/tables'
import { nameRu } from '../../i18n/names'

/** A book's topic in the forms its title prefixes need. */
interface Topic {
  /** After «о»: «о реке». */
  about: string
  /** Of whom or what: «Книга реки». */
  of: string
  /** Where letters come from: «Письма с реки». */
  from: string
}

// BOOK_TITLE_TOPIC.
const TOPICS: Record<string, Topic> = {
  'the River': { about: 'реке', of: 'реки', from: 'с реки' },
  'the Sky': { about: 'небе', of: 'неба', from: 'с неба' },
  'the Hearth': { about: 'очаге', of: 'очага', from: 'от очага' },
  'the Wandering': { about: 'странствии', of: 'странствия', from: 'из странствия' },
  'the Coming': { about: 'грядущем', of: 'грядущего', from: 'из грядущего' },
  'the Long Road': { about: 'долгой дороге', of: 'долгой дороги', from: 'с долгой дороги' },
  'the Stone': { about: 'камне', of: 'камня', from: 'от камня' },
  'the Star': { about: 'звезде', of: 'звезды', from: 'со звезды' },
  'the First Word': { about: 'первом слове', of: 'первого слова', from: 'от первого слова' },
  'the Old Year': { about: 'минувшем годе', of: 'минувшего года', from: 'из минувшего года' },
  'the Hunters': { about: 'охотниках', of: 'охотников', from: 'от охотников' },
  'the Builders': { about: 'строителях', of: 'строителей', from: 'от строителей' },
  'the Sea': { about: 'море', of: 'моря', from: 'с моря' },
  'the Mountain': { about: 'горе', of: 'горы', from: 'с горы' },
  'the Forest': { about: 'лесе', of: 'леса', from: 'из леса' },
}

// BOOK_TITLE_PREFIX, longest first so "The Book of" is not read as "Of".
const PREFIXES: [string, (t: Topic) => string][] = [
  ['Reflections upon', (t) => `Размышления о ${t.about}`],
  ['A Treatise on', (t) => `Трактат о ${t.about}`],
  ['Letters from', (t) => `Письма ${t.from}`],
  ['The Book of', (t) => `Книга ${t.of}`],
  ['Notes on', (t) => `Заметки о ${t.about}`],
  ['Songs of', (t) => `Песни ${t.of}`],
  ['Tales of', (t) => `Сказания о ${t.about}`],
  ['On', (t) => `О ${t.about}`],
  ['Of', (t) => `Слово о ${t.about}`],
]

/** "Notes on the River" → «Заметки о реке»; null for a title not made that way. */
export function bookTitle(title: string): string | null {
  for (const [prefix, make] of PREFIXES) {
    if (!title.startsWith(`${prefix} `)) continue
    const topic = TOPICS[title.slice(prefix.length + 1)]
    if (topic) return make(topic)
  }
  return null
}

/** An artwork's kind (`ArtKind::name`): as a title says it, and as the object of «создал». */
export const ART_KINDS: Record<string, { name: string; made: string }> = {
  cave_painting: { name: 'наскальный рисунок', made: 'наскальный рисунок' },
  sculpture: { name: 'скульптура', made: 'скульптуру' },
  fresco: { name: 'фреска', made: 'фреску' },
  painting: { name: 'картина', made: 'картину' },
  photograph: { name: 'фотография', made: 'фотографию' },
  film: { name: 'фильм', made: 'фильм' },
  digital: { name: 'цифровая работа', made: 'цифровую работу' },
}

/** "Untitled cave_painting no.12" → «Без названия № 12». */
export function artworkTitle(title: string): string | null {
  const m = /^Untitled ([a-z_]+) no\.(\d+)$/.exec(title)
  return m && m[1] in ART_KINDS ? `Без названия № ${m[2]}` : null
}

/**
 * A faith's name. A faith founded under a name already taken gets its id
 * appended ("Sun Path rel7", "Sun Path rel7-2"): the name is translated and
 * the id kept as a number, so the two faiths stay apart («Путь Солнца № 7»).
 */
export function faithName(name: string): string | null {
  const m = /^(.*?) rel(\d+(?:-\d+)?)$/.exec(name)
  const base = SIM_TABLES.religion[m ? m[1] : name]?.ru
  if (!base) return null
  return m ? `${base} № ${m[2]}` : base
}

/** Composed names for `{value|domain}` placeholders, beside the simLabel tables. */
export const NAME_DOMAINS: Record<string, (value: string) => string | null> = {
  book: bookTitle,
  artwork: artworkTitle,
  faith: faithName,
  // A word of a tribe's own language, made of the same syllables as names: «ри».
  word: (value) => nameRu(value),
  // What a caravan carries: a good, or a practice counter it trades like one ("paint mural").
  cargo: (value) => (SIM_TABLES.good[value] ?? SIM_TABLES.practice[value])?.ru ?? null,
}
