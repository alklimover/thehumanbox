// Fork: the whole chronicle of a world, as the desktop simulation keeps it
// (apps/server/src/fork_chronicle). Entries arrive newest first, in English as
// the simulation wrote them; they are grouped by calendar year here and
// translated only when shown.
import { calendarSeasonAt, YEAR_TICKS } from '../../game/model/calendar'
import { t, tn, type MessageKey } from '../../i18n'
import { displayName } from '../../i18n/names'
import { simLabel } from '../../i18n/sim'
import { simActor, simText, type Sex } from '../../i18n/simtext'

export interface ChronicleTribeLink {
  id: string
  /** The tribe's name when the line was written. */
  name: string
}

export interface ChronicleEntry {
  id: number
  tick: number
  /** event, headline, story, era (salvaged era ladder) or server (a tribe died out). */
  src: string
  kind: string
  cat: string
  actor: string
  text: string
  /** The world's era when it was written. */
  era: string
  restored?: boolean
  tribes: ChronicleTribeLink[]
  /** The sex of the person the line is about, as the simulation knew it. */
  sex?: string
}

export interface ChronicleYear {
  /** Counted from 0, as the server groups ticks. */
  year: number
  count: number
  era: string
}

export interface ChronicleTribe {
  id: string
  name: string
  first_tick: number
  last_tick: number
  died_out_tick: number | null
  peak: number
  entries: number
}

/** The chronicle's headings, in the order the filter shows them. */
export const CATEGORIES = [
  'eras',
  'war',
  'faith',
  'discovery',
  'disaster',
  'tribes',
  'milestones',
  'other',
  'people',
  'nature',
  'prayers',
] as const

export type ChronicleCategory = (typeof CATEGORIES)[number]

/** People, nature and prayers are many and small: off until asked for. */
export const DEFAULT_CATEGORIES: readonly ChronicleCategory[] = CATEGORIES.filter(
  (c) => c !== 'people' && c !== 'nature' && c !== 'prayers',
)

export const CATEGORY_LABEL: Record<ChronicleCategory, MessageKey> = {
  eras: 'chronicle.cat.eras',
  war: 'chronicle.cat.war',
  faith: 'chronicle.cat.faith',
  discovery: 'chronicle.cat.discovery',
  disaster: 'chronicle.cat.disaster',
  tribes: 'chronicle.cat.tribes',
  milestones: 'chronicle.cat.milestones',
  people: 'chronicle.cat.people',
  nature: 'chronicle.cat.nature',
  prayers: 'chronicle.cat.prayers',
  other: 'chronicle.cat.other',
}

export const CATEGORY_ICON: Record<string, string> = {
  eras: '◈',
  war: '⚔',
  faith: '✧',
  discovery: '✦',
  disaster: '☄',
  tribes: '⚑',
  milestones: '◆',
  people: '☺',
  nature: '☘',
  prayers: '⁂',
  other: '·',
}

export const CATEGORY_COLOR: Record<string, string> = {
  eras: '#ccaaff',
  war: '#e2574c',
  faith: '#f3d17a',
  discovery: '#7cc8ff',
  disaster: '#d9774e',
  tribes: '#8fd49a',
  milestones: '#d8b270',
  people: '#aabbcc',
  nature: '#9fbf7a',
  prayers: '#f2e2a0',
  other: '#998',
}

const SEASON_KEY: Record<string, MessageKey> = {
  abundance: 'calendar.season.abundance',
  decline: 'calendar.season.decline',
  scarcity: 'calendar.season.scarcity',
  recovery: 'calendar.season.recovery',
}

/** The calendar year (counted from 0) a tick falls in. */
export function yearOf(tick: number): number {
  return Math.floor(Math.max(0, tick) / YEAR_TICKS)
}

/** The season's name for a row ("Winter", «зима»). */
export function seasonOf(tick: number): string {
  return t(SEASON_KEY[calendarSeasonAt(tick)])
}

export interface YearGroup {
  year: number
  /** How many entries of this year match the filter (the server's count, or the loaded ones). */
  count: number
  era: string
  entries: ChronicleEntry[]
}

/**
 * Entries (newest first) under their years. The count and era of a year come
 * from the server's tally when it has one: a year may be only partly loaded.
 */
export function groupByYear(
  entries: readonly ChronicleEntry[],
  years: readonly ChronicleYear[],
): YearGroup[] {
  const tally = new Map(years.map((y) => [y.year, y]))
  const groups: YearGroup[] = []
  for (const e of entries) {
    const year = yearOf(e.tick)
    let group = groups[groups.length - 1]
    if (!group || group.year !== year) {
      const known = tally.get(year)
      group = { year, count: known?.count ?? 0, era: known?.era ?? e.era, entries: [] }
      groups.push(group)
    }
    group.entries.push(e)
  }
  for (const g of groups) g.count = Math.max(g.count, g.entries.length)
  return groups
}

/** Newer entries on top of the ones already shown, without doubles, newest first. */
export function mergeNewer(
  shown: readonly ChronicleEntry[],
  newer: readonly ChronicleEntry[],
): ChronicleEntry[] {
  if (newer.length === 0) return shown as ChronicleEntry[]
  const have = new Set(shown.map((e) => e.id))
  const fresh = newer.filter((e) => !have.has(e.id))
  if (fresh.length === 0) return shown as ChronicleEntry[]
  return [...fresh, ...shown].sort((a, b) => b.tick - a.tick || b.id - a.id)
}

/** Adds the newly arrived entries to the years' tally. */
export function countNewer(
  years: readonly ChronicleYear[],
  fresh: readonly ChronicleEntry[],
): ChronicleYear[] {
  if (fresh.length === 0) return years as ChronicleYear[]
  const out = new Map(years.map((y) => [y.year, { ...y }]))
  for (const e of fresh) {
    const y = yearOf(e.tick)
    const known = out.get(y)
    if (known) {
      known.count += 1
      known.era = e.era
    } else out.set(y, { year: y, count: 1, era: e.era })
  }
  return [...out.values()].sort((a, b) => b.year - a.year)
}

const WORLD_ACTORS = new Set(['world', 'the world', 'the sky', 'the earth', 'the gods', ''])
const LINEAGE_ID = /\b[0-9a-f]{8}\b/g

/** The text with the tribes' ids written as their names (battles and treaties name ids). */
export function withNames(text: string, tribes: readonly ChronicleTribeLink[]): string {
  if (tribes.length === 0 || !/[0-9a-f]{8}/.test(text)) return text
  const names = new Map(tribes.map((tr) => [tr.id, tr.name]))
  return text.replace(LINEAGE_ID, (id) => names.get(id) ?? id)
}

/** Who did it, when the line does not say so itself; '' for the world. */
export function entryActor(e: ChronicleEntry): string {
  // A headline names its own people; so do many events ("Kefe entered the iron era").
  if (e.src !== 'event') return ''
  const actor = withNames(e.actor, e.tribes)
  // A battle is its own actor ("battle_3120_<a>_<b>", "border_war_…"): the line names both sides.
  if (WORLD_ACTORS.has(actor.toLowerCase()) || actor.includes('_')) return ''
  return withNames(e.text, e.tribes).includes(actor) ? '' : actor
}

/** The person a line is about: an event's actor, or the name a headline starts with. */
export function entryPerson(e: ChronicleEntry): string | null {
  if (e.src === 'event') return e.actor || null
  if (e.src !== 'headline') return null
  const first = /^[^\p{L}]*(\p{Lu}\p{Ll}+) /u.exec(e.text)?.[1]
  return first && first !== 'The' && first !== 'Year' ? first : null
}

/**
 * Whose sex the Russian verbs follow: the person the line is about, as the
 * simulation recorded it, or looked up by name. A tribe reads as «народ»
 * (masculine) rather than «учредил(а)».
 */
export function entrySex(e: ChronicleEntry, sexOf: (name: string) => Sex | null): Sex | null {
  if (e.sex === 'male' || e.sex === 'female') return e.sex
  if (e.src === 'event') {
    const actor = withNames(e.actor, e.tribes)
    if (e.tribes.some((tr) => tr.name === actor)) return 'male'
  }
  const person = entryPerson(e)
  return person ? sexOf(person) : null
}

/**
 * The line as shown in the player's language (the actor is shown apart, see
 * entryActor). `sexOf` knows the people of the world on screen; the line's own
 * person comes from the line, so a memory of someone long dead still agrees.
 */
export function entryText(
  e: ChronicleEntry,
  sexOf: (name: string) => Sex | null = () => null,
  peak = 0,
): string {
  if (e.src === 'server' && e.kind === 'died_out') {
    const name = displayName(e.tribes[0]?.name ?? e.actor)
    return peak > 0 ? tn('chronicle.diedOutPeak', peak, { name }) : t('chronicle.diedOut', { name })
  }
  if (e.src === 'era') return t('chronicle.worldEra', { era: simLabel('era', e.text) })
  const sex = entrySex(e, sexOf)
  const person = entryPerson(e)
  const ctx = { sex, sexOf: (name: string) => (name === person && sex ? sex : sexOf(name)) }
  const text = withNames(e.text, e.tribes)
  return simText(e.src === 'headline' ? 'headline' : 'event', text, ctx)
}

/** A line that starts the row (no actor before it) starts with a capital. */
export function sentence(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

/** The actor as shown: a tribe or a person by name, in the player's alphabet. */
export function shownActor(actor: string): string {
  return actor ? simActor(actor) : ''
}

/** What the filter asks the server for. */
export interface ChronicleFilter {
  categories: readonly ChronicleCategory[]
  lineage: string | null
}

/** The query string of a page: every heading on is the same as no filter. */
export function pageQuery(
  filter: ChronicleFilter,
  page: { before?: { tick: number; id: number }; afterId?: number; limit?: number } = {},
): string {
  const q = new URLSearchParams()
  if (filter.categories.length < CATEGORIES.length) q.set('kinds', filter.categories.join(','))
  if (filter.lineage) q.set('lineage', filter.lineage)
  if (page.before) {
    q.set('before_tick', String(page.before.tick))
    q.set('before_id', String(page.before.id))
  }
  if (page.afterId !== undefined) q.set('after_id', String(page.afterId))
  if (page.limit !== undefined) q.set('limit', String(page.limit))
  return q.toString()
}

const FILTER_KEY = 'thb.fork.chronicle.categories'

/** The headings the player chose last time, or the defaults. */
export function loadCategories(storage: Pick<Storage, 'getItem'> | null): ChronicleCategory[] {
  try {
    const raw = storage?.getItem(FILTER_KEY)
    if (raw) {
      const list = JSON.parse(raw) as unknown
      if (Array.isArray(list)) {
        return CATEGORIES.filter((c) => list.includes(c))
      }
    }
  } catch {
    /* unreadable: defaults */
  }
  return [...DEFAULT_CATEGORIES]
}

export function saveCategories(
  storage: Pick<Storage, 'setItem'> | null,
  categories: readonly ChronicleCategory[],
): void {
  try {
    storage?.setItem(FILTER_KEY, JSON.stringify(categories))
  } catch {
    /* private mode: not kept */
  }
}

/** Tribes for the filter, by their shown name; the ones with nobody left say so. */
export function tribeOptions(
  tribes: readonly ChronicleTribe[],
  alive: ReadonlySet<string> | null,
): { id: string; label: string; diedOut: boolean }[] {
  return tribes
    .map((tr) => {
      const diedOut = isDiedOut(tr.id, tribes, alive)
      const name = displayName(tr.name)
      return { id: tr.id, label: diedOut ? `${name} ${t('chronicle.diedOutMark')}` : name, diedOut }
    })
    .sort((a, b) => Number(a.diedOut) - Number(b.diedOut) || a.label.localeCompare(b.label))
}

/** The tribe a row's ▸ goes to: the first it names that still has people; null when none has. */
export function liveTribe(
  e: ChronicleEntry,
  tribes: readonly ChronicleTribe[],
  alive: ReadonlySet<string> | null,
): ChronicleTribeLink | null {
  return e.tribes.find((tr) => !isDiedOut(tr.id, tribes, alive)) ?? null
}

/**
 * Whether a tribe has nobody left: the chronicle noticed it dying out, and the
 * world on screen shows nobody of it either (a tribe raised again is back
 * there before the server's next census of the tribes).
 */
export function isDiedOut(
  lineage: string,
  tribes: readonly ChronicleTribe[],
  alive: ReadonlySet<string> | null,
): boolean {
  if (alive?.has(lineage)) return false
  return tribes.find((tr) => tr.id === lineage)?.died_out_tick != null
}
