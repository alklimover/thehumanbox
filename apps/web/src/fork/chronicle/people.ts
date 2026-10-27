// Fork: the chronicle's lines about people, made readable when shown. A busy
// world writes dozens of "{name} is gone. What they carried: …" and "{name}
// became an elder, carrying: …" lines a season; the rows only show the season,
// so the ones of a season are told as one row that opens to the names. A
// death whose memory is only its cause reads as «Не стало Гоку (утонул)».
import { SEASON_TICKS } from '../../game/model/calendar'
import { ft, ftn, type ForkMessageKey } from '../i18n'
import { displayName } from '../i18n/names'
import { simLabel } from '../i18n/sim'
import { simText, type Sex } from '../i18n/simtext'
import { genderize } from '../i18n/simtext/engine'
import { entryPerson, entrySex, entryText, type ChronicleEntry } from './model'

export type PersonKind = 'gone' | 'elder'

export interface PersonLine {
  kind: PersonKind
  /** The person's name as the simulation wrote it. */
  name: string
  /** The memory the line quotes; null for "became an elder among the people". */
  memory: string | null
  /** The cause of death (a `deathCause` id) when the memory is only the person's own death. */
  cause: string | null
}

// crates/sim-core/src/sim/simulation/organism_tick/mortality.rs and civ_tick/people.rs.
const GONE = /^(\S+) is gone\. What they carried: "(.*)"(?: \(held in mind \d+ times\))?$/s
const ELDER = /^(\S+) became an elder, carrying: "(.*)"$/s
const ELDER_PLAIN = /^(\S+) became an elder among the people$/

/** The cause, when a memory is the last line of a life (mortality.rs, battles.rs). */
export function causeOfDeath(memory: string): string | null {
  if (/^died of old age at \d+$/.test(memory)) return 'old age'
  if (/^fell in battle at age \d+$/.test(memory)) return 'war'
  return /^died of (.+) at age \d+$/.exec(memory)?.[1] ?? null
}

/** What a people line says, or null for any other line. */
export function personLine(e: ChronicleEntry): PersonLine | null {
  if (e.src !== 'headline') return null
  const gone = GONE.exec(e.text)
  if (gone) return { kind: 'gone', name: gone[1], memory: gone[2], cause: causeOfDeath(gone[2]) }
  const elder = ELDER.exec(e.text)
  if (elder) return { kind: 'elder', name: elder[1], memory: elder[2], cause: null }
  const plain = ELDER_PLAIN.exec(e.text)
  return plain ? { kind: 'elder', name: plain[1], memory: null, cause: null } : null
}

export interface PersonMember {
  entry: ChronicleEntry
  line: PersonLine
}

/** A row of the list: one entry, or the people of a season told together. */
export type HistoryItem =
  | { type: 'entry'; entry: ChronicleEntry; line: PersonLine | null }
  | { type: 'group'; key: string; kind: PersonKind; tick: number; members: PersonMember[] }

/**
 * Entries (newest first) as rows. Deaths of one season make one row, and so do
 * new elders, standing where the season's latest of them stands; a season with
 * one of them keeps it as an entry. Rows show only the season, so nothing out
 * of order shows. Done over everything loaded: when a page boundary cuts a
 * season, the next page adds to that season's row instead of starting another.
 */
export function collapsePeople(entries: readonly ChronicleEntry[]): HistoryItem[] {
  const items: HistoryItem[] = []
  const groups = new Map<string, Extract<HistoryItem, { type: 'group' }>>()
  for (const entry of entries) {
    const line = personLine(entry)
    if (!line) {
      items.push({ type: 'entry', entry, line: null })
      continue
    }
    const key = `${line.kind}:${Math.floor(Math.max(0, entry.tick) / SEASON_TICKS)}`
    const group = groups.get(key)
    if (group) {
      group.members.push({ entry, line })
      continue
    }
    const created = {
      type: 'group' as const,
      key,
      kind: line.kind,
      tick: entry.tick,
      members: [{ entry, line }],
    }
    groups.set(key, created)
    items.push(created)
  }
  return items.map((item) =>
    item.type === 'group' && item.members.length === 1
      ? { type: 'entry', entry: item.members[0].entry, line: item.members[0].line }
      : item,
  )
}

const CAUSE_KEY: Record<string, ForkMessageKey> = {
  'old age': 'chronicle.people.cause.oldAge',
  starvation: 'chronicle.people.cause.starvation',
  dehydration: 'chronicle.people.cause.dehydration',
  sickness: 'chronicle.people.cause.sickness',
  beasts: 'chronicle.people.cause.beasts',
  drowning: 'chronicle.people.cause.drowning',
  fire: 'chronicle.people.cause.fire',
  disaster: 'chronicle.people.cause.disaster',
  war: 'chronicle.people.cause.war',
  combat: 'chronicle.people.cause.combat',
  murder: 'chronicle.people.cause.murder',
  executed: 'chronicle.people.cause.executed',
}

/** How someone died, said of them: «утонула», «от старости»; a new cause by its name. */
export function causePhrase(cause: string, sex: Sex | null): string {
  const key = CAUSE_KEY[cause]
  return key ? genderize(ft(key), sex) : simLabel('deathCause', cause)
}

type SexOf = (name: string) => Sex | null

function sexes(entry: ChronicleEntry, sexOf: SexOf) {
  const sex = entrySex(entry, sexOf)
  const person = entryPerson(entry)
  return { sex, sexOf: (name: string) => (name === person && sex ? sex : sexOf(name)) }
}

/** A people line shown on its own row. */
export function personText(member: PersonMember, sexOf: SexOf, peak = 0): string {
  const { entry, line } = member
  if (line.kind === 'gone' && line.cause) {
    return ft('chronicle.people.goneCause', {
      name: displayName(line.name),
      cause: causePhrase(line.cause, entrySex(entry, sexOf)),
    })
  }
  return entryText(entry, sexOf, peak)
}

/** One person inside an opened row: the name and how they died or what they carried. */
export function memberText(member: PersonMember, sexOf: SexOf): string {
  const { entry, line } = member
  const name = displayName(line.name)
  const ctx = sexes(entry, sexOf)
  if (line.cause) return ft('chronicle.people.memberCause', { name, cause: causePhrase(line.cause, ctx.sex) })
  if (!line.memory) return name
  // The memory as the line itself translates it: the person's sex, the names in it.
  return ft('chronicle.people.memberCarried', { name, memory: simText('memory', line.memory, ctx) })
}

const PREVIEW = 3

/** The first names and how many more. */
function namesPreview(members: readonly PersonMember[]): string {
  const names = members.slice(0, PREVIEW).map((m) => displayName(m.line.name))
  const rest = members.length - names.length
  return rest > 0 ? ft('chronicle.people.namesMore', { names: names.join(', '), n: rest }) : names.join(', ')
}

/** Causes, the commonest first: «утопление — 3, старость — 2»; null when none is known. */
function causesSummary(members: readonly PersonMember[]): { text: string; all: boolean } | null {
  const counts = new Map<string, number>()
  for (const m of members) if (m.line.cause) counts.set(m.line.cause, (counts.get(m.line.cause) ?? 0) + 1)
  if (counts.size === 0) return null
  const text = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([cause, n]) => ft('chronicle.people.causeCount', { cause: simLabel('deathCause', cause), n }))
    .join(', ')
  const known = [...counts.values()].reduce((a, b) => a + b, 0)
  return { text, all: known === members.length }
}

/**
 * The row of a season's people: how many, then the causes when every death has
 * one, else the first names and the causes that are known.
 */
export function groupText(kind: PersonKind, members: readonly PersonMember[]): string {
  const n = members.length
  if (kind === 'elder') return ftn('chronicle.people.elders', n, { detail: namesPreview(members) })
  const causes = causesSummary(members)
  if (causes?.all) return ftn('chronicle.people.gone', n, { detail: causes.text })
  const names = namesPreview(members)
  return ftn('chronicle.people.gone', n, { detail: causes ? `${names} · ${causes.text}` : names })
}
