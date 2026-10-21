// The simulation's own text (thoughts, events, the life log, memories,
// headlines) in the player's language. See ./engine for the table format and
// docs/fork/SIMTEXT.ru.md for how the tables are made.
import { getLocale } from '../locale'
import { SIM_TABLES, type SimDomain } from '../sim/tables'
import { milestoneDescription } from '../sim/milestone'
import {
  genderize,
  makeSimText,
  type Sex,
  type SimTextChannel,
  type SimTextContext,
  type SimTextTable,
} from './engine'
import { NAME_DOMAINS, artworkTitle, bookTitle, faithName } from './names'
import { actions } from './ru/actions'
import { events } from './ru/events'
import { headlines } from './ru/headlines'
import { memories } from './ru/memories'
import { thoughts } from './ru/thoughts'
import { displayName, namesInText } from '../names'

export type { Sex, SimTextChannel, SimTextContext } from './engine'

/**
 * World milestones, already translated for the chronicle (i18n/sim/milestone):
 * the description alone in the event feed, and "first_fire: the first flame is
 * tamed" in the headlines.
 */
const milestones: SimTextTable = Object.fromEntries(
  Object.entries(milestoneDescription).flatMap(([id, d]) => [
    [d.en, d.ru],
    [`${id}: ${d.en}`, `${SIM_TABLES.milestone[id]?.ru ?? id}: ${d.ru}`],
  ]),
)

export const RU_SIM_TEXT_TABLES = [thoughts, actions, events, memories, headlines, milestones] as const

/**
 * A simulation id inside a text, by the simLabel tables. The simulation often
 * writes ids with spaces ("bronze working" for bronze_working).
 */
function labelId(domain: string, id: string): string | null {
  const named = NAME_DOMAINS[domain]
  if (named) return named(id)
  const table = SIM_TABLES[domain as SimDomain]
  if (!table) return null
  const entry =
    table[id] ?? table[id.toLowerCase()] ?? table[id.replace(/ /g, '_')] ?? table[id.replace(/ /g, '-')]
  return entry?.ru ?? null
}

const ru = makeSimText(RU_SIM_TEXT_TABLES, labelId)

// A person's reflection (Organism::reflect_internally in organism/organism/inner.rs):
// "{mood}{, a <aspiration> at heart}: {frame} — {memory, lowercased}" or
// "I am {name}{, a <aspiration> at heart}, here in the world". Its parts come
// from several places, so it is taken apart here rather than by a template.
const REFLECTION =
  /^(.+?)(?:, a ([a-z]+) at heart)?: (I remember|I think of them|I haven't forgotten|I know this|that place|I dreamt) — (.+)$/s
const SELF = /^I am (.+?)(?:, a ([a-z]+) at heart)?, here in the world$/
const FRAME: Record<string, string> = {
  'I remember': 'я помню',
  'I think of them': 'я думаю о них',
  "I haven't forgotten": 'я не [забыл|забыла]',
  'I know this': 'я знаю',
  'that place': 'то место',
  'I dreamt': 'мне снилось',
}

function reflection(text: string, ctx: SimTextContext | undefined): string | null {
  const heart = (asp: string | undefined) => (asp ? `, в душе ${labelId('aspiration', asp) ?? asp}` : '')
  const self = SELF.exec(text)
  if (self) return `я — ${self[1]}${heart(self[2])}, здесь, в этом мире`
  const m = REFLECTION.exec(text)
  if (!m) return null
  const mood = ru.part('thought', m[1], ctx)
  if (mood === null) return null
  const memory = ru.part('memory', m[4], ctx) ?? m[4]
  return `${mood}${heart(m[2])}: ${genderize(FRAME[m[3]], ctx?.sex)} — ${memory}`
}

/** The text to show for something the simulation wrote; English stays as it is. */
export function simText(
  channel: SimTextChannel,
  text: string | null | undefined,
  ctx?: SimTextContext,
): string {
  if (getLocale() === 'en') return text ?? ''
  if (text && channel === 'thought') {
    const r = reflection(text, ctx)
    if (r) return stillEnglish(r) ? r : namesInText(r)
  }
  const shown = ru.text(channel, text, ctx)
  // A line still (partly) in English keeps its names in Latin, like the rest of it.
  return shown === text || stillEnglish(shown) ? shown : namesInText(shown)
}

/** Whether a lowercase English word (three letters or more) is left, besides names and ids. */
function stillEnglish(text: string): boolean {
  return /\b[a-z]{3,}\b/.test(text)
}

/** Who did something, as an event row shows it: «мир», a tribe, or a person's name in Cyrillic. */
export function simActor(actor: string | null | undefined): string {
  if (getLocale() === 'en' || !actor) return actor ?? ''
  const shown = ru.text('event', actor)
  return shown === actor ? displayName(actor) : namesInText(shown)
}

const named =
  (translate: (value: string) => string | null) =>
  (value: string | null | undefined): string =>
    getLocale() === 'en' || !value ? (value ?? '') : (translate(value) ?? value)

/** A book's title, an artwork's title and a faith's name as shown (see ./names). */
export const simBookTitle = named(bookTitle)
export const simArtworkTitle = named(artworkTitle)
export const simFaithName = named(faithName)

/** Whether the Russian tables know a text (for the untranslated-text check). */
export function hasSimText(channel: SimTextChannel, text: string): boolean {
  return (channel === 'thought' && reflection(text, {}) !== null) || ru.knows(channel, text)
}

/** The person's sex as simText wants it. */
export function sexOf(person: { sex?: string | null } | null | undefined): Sex | null {
  return person?.sex === 'male' || person?.sex === 'female' ? person.sex : null
}

const byNameCache = new WeakMap<readonly unknown[], Map<string, Sex | null>>()

/**
 * Looks up the sex of a person by name among the given people (the event feed
 * only knows the actor's name). The index is built once per people array.
 */
export function sexByName(
  people: readonly { name: string; sex?: string | null }[] | null | undefined,
): (name: string) => Sex | null {
  if (!people) return () => null
  let index = byNameCache.get(people)
  if (!index) {
    index = new Map()
    for (const p of people) if (!index.has(p.name)) index.set(p.name, sexOf(p))
    byNameCache.set(people, index)
  }
  const found = index
  return (name) => found.get(name) ?? null
}
