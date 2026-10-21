// The simulation's own text (thoughts, events, the life log, memories,
// headlines) in the player's language. See ./engine for the table format and
// docs/fork/SIMTEXT.ru.md for how the tables are made.
import { getLocale } from '../locale'
import { SIM_TABLES, type SimDomain } from '../sim/tables'
import { milestoneDescription } from '../sim/milestone'
import { makeSimText, type Sex, type SimTextChannel, type SimTextContext, type SimTextTable } from './engine'
import { actions } from './ru/actions'
import { events } from './ru/events'
import { headlines } from './ru/headlines'
import { memories } from './ru/memories'
import { thoughts } from './ru/thoughts'

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
  const table = SIM_TABLES[domain as SimDomain]
  if (!table) return null
  const entry =
    table[id] ?? table[id.toLowerCase()] ?? table[id.replace(/ /g, '_')] ?? table[id.replace(/ /g, '-')]
  return entry?.ru ?? null
}

const ru = makeSimText(RU_SIM_TEXT_TABLES, labelId)

/** The text to show for something the simulation wrote; English stays as it is. */
export function simText(
  channel: SimTextChannel,
  text: string | null | undefined,
  ctx?: SimTextContext,
): string {
  if (getLocale() === 'en') return text ?? ''
  return ru.text(channel, text, ctx)
}

/** Whether the Russian tables know a text (for the untranslated-text check). */
export function hasSimText(channel: SimTextChannel, text: string): boolean {
  return ru.knows(channel, text)
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
