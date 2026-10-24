// Fork: what is worth watching in the world right now, for the mode panel
// (StoryPanel.tsx). Pure reads of the frames the client already has; the
// simulation sends no "story" of its own. The observer gets wars, feuds, new
// faiths, eras and towns; the god gets the tribes and prayers that need a
// power, and what that power is. Names stay in the nominative: every phrase is
// built so a tribe's or a person's name needs no case ending.
import { t, tn } from '../../i18n'
import { displayName } from '../../i18n/names'
import { simLabel } from '../../i18n/sim'
import { simFaithName } from '../../i18n/simtext'
import { ageInYears, YEAR_TICKS } from '../../game/model/calendar'
import { familyLines } from '../../game/model/family-lines'
import { PERIL_HELP, remainingLine, tribeHome } from '../../game/model/tribe-peril'
import {
  prayerPlea,
  prayerRows,
  prayerRowText,
  prayerTimeLeft,
  PRAYER_KINDS,
  type PrayerRow,
} from '../../game/model/prayers'
import { eraRows } from '../../game/model/era-flourish'
import { personName } from '../../shared/personName'
import { SANDBOX_CATEGORIES } from '../../simulation/sandbox'
import type { GoalStatus, PrayerInfo, WorldState } from '../../shared/types'

export type StoryKind =
  | 'war'
  | 'brink'
  | 'peril'
  | 'faith'
  | 'threshold'
  | 'era'
  | 'town'
  | 'outbreak'
  | 'festival'
  | 'elder'
  | 'family'
  | 'prayer'

/** What the row's button does: look, pick up a power there, or answer a prayer. */
export type StoryAction =
  { kind: 'show' } | { kind: 'tool'; tool: string } | { kind: 'prayer'; prayer: PrayerInfo }

export interface Story {
  /** The same war, the same tribe on the brink: stable from frame to frame. */
  key: string
  kind: StoryKind
  icon: string
  title: string
  detail: string
  /** How much it matters now; the panel shows the heaviest. */
  weight: number
  /** Where the camera goes. */
  at: { x: number; y: number } | null
  /** The tribe to single out. */
  lineage?: string
  /**
   * The tribes the row is about, for MAX_PER_TRIBE. A row that counts its
   * tribes rather than names them (a feast of five, rain for three) has none.
   */
  tribes?: readonly string[]
  /** The person to single out. */
  person?: string
  action: StoryAction
}

/** Shown only while the world has fewer than three real stories. */
export const FILLER_KINDS: ReadonlySet<StoryKind> = new Set(['elder', 'family'])

/** A new faith, era or town stays a story for this long (game time). */
export const NEWS_TICKS = YEAR_TICKS / 2

type World = WorldState

function tribeName(world: Pick<World, 'lineage_names'>, id: string): string {
  return displayName(world.lineage_names?.[id]) || id.slice(0, 6)
}

/** A side of a war, as the row names it: its first two tribes. */
const SIDE = 2

function names(world: Pick<World, 'lineage_names'>, ids: readonly string[]): string {
  return ids
    .slice(0, SIDE)
    .map((id) => tribeName(world, id))
    .join(', ')
}

/** A power as the dock names it. */
export function toolLabel(id: string): string {
  return SANDBOX_CATEGORIES.flatMap((c) => c.tools).find((tool) => tool.id === id)?.label ?? id
}

function capital(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

function alive(world: Pick<World, 'lineage_sizes'>, id: string): boolean {
  return (world.lineage_sizes ?? []).some((l) => l.id === id && l.count > 0)
}

function home(world: World, lineage: string | undefined) {
  return lineage ? tribeHome(world, lineage) : null
}

// ---------------------------------------------------------------- memory

interface EraChange {
  lineage: string
  era: string
  prev: string
  tick: number
}

/**
 * What a single frame cannot say: which faiths, eras and towns are new. Fed
 * every frame (or every few seconds); whatever is there on the first look is
 * not news, so loading a save does not announce its whole past. A clock that
 * goes back means another world, and the memory starts over.
 */
export class StoryWatch {
  start = -1
  private lastTick = -Infinity
  readonly faiths = new Map<string, number>()
  private eras = new Map<string, string>()
  eraChanges: EraChange[] = []
  private towns = new Map<string, number>()
  townRises: { lineage: string; tick: number }[] = []

  update(world: Pick<World, 'tick' | 'religions' | 'lineage_eras' | 'settlements'>): void {
    if (world.tick < this.lastTick) {
      this.start = -1
      this.faiths.clear()
      this.eras.clear()
      this.towns.clear()
      this.eraChanges = []
      this.townRises = []
    }
    const first = this.start < 0
    if (first) this.start = world.tick
    this.lastTick = world.tick
    for (const r of world.religions ?? []) {
      if (!this.faiths.has(r.id)) this.faiths.set(r.id, first ? -Infinity : world.tick)
    }
    for (const [lineage, era] of eraRows(world)) {
      const before = this.eras.get(lineage)
      if (before !== undefined && before !== era) {
        this.eraChanges = this.eraChanges.filter((c) => c.lineage !== lineage)
        this.eraChanges.push({ lineage, era, prev: before, tick: world.tick })
      }
      this.eras.set(lineage, era)
    }
    for (const s of world.settlements ?? []) {
      const before = this.towns.get(s.lineage_id)
      if (before !== undefined && before < TOWN_TIER && s.tier >= TOWN_TIER)
        this.townRises.push({ lineage: s.lineage_id, tick: world.tick })
      this.towns.set(s.lineage_id, s.tier)
    }
    const fresh = (tick: number) => world.tick - tick < NEWS_TICKS
    this.eraChanges = this.eraChanges.filter((c) => fresh(c.tick))
    this.townRises = this.townRises.filter((c) => fresh(c.tick))
  }
}

/** `town` in the simulation's TIER_NAMES (sim/civ/society/settlements.rs); `city` is above it. */
const TOWN_TIER = 4

// ---------------------------------------------------------------- the observer

export function warStories(world: World, god = false): Story[] {
  return (world.battles ?? [])
    .filter((b) => !b.ended && b.attackers.length > 0 && b.defenders.length > 0)
    .map((b) => {
      const fallen = b.casualties_a + b.casualties_d
      return {
        key: `war:${b.id}`,
        kind: 'war' as const,
        icon: '⚔️',
        title: t('modes.story.war', { a: names(world, b.attackers), b: names(world, b.defenders) }),
        detail: god
          ? t('modes.story.war.god', { peace: toolLabel('peace'), smite: toolLabel('smite') })
          : fallen > 0
            ? tn('modes.story.war.fallen', fallen)
            : t('modes.story.war.fresh'),
        weight: (god ? 60 : 90) + Math.min(fallen, 40) + Math.min(b.initial_a + b.initial_d, 40) / 4,
        at: { x: b.location[0], y: b.location[1] },
        lineage: b.attackers[0],
        tribes: [...b.attackers.slice(0, SIDE), ...b.defenders.slice(0, SIDE)],
        action: { kind: 'show' as const },
      }
    })
}

/** Rival tribes not yet at war, the worst feud first. */
export function brinkStories(world: World): Story[] {
  const fighting = new Set<string>()
  for (const b of world.battles ?? []) {
    if (b.ended) continue
    for (const a of b.attackers) for (const d of b.defenders) fighting.add([a, d].sort().join('|'))
  }
  const feuds = (world.tribal_relations ?? [])
    .filter((r) => r.status === 'rivals' && r.a !== r.b && alive(world, r.a) && alive(world, r.b))
    .filter((r) => !fighting.has([r.a, r.b].sort().join('|')))
    .sort((x, y) => x.attitude - y.attitude || x.a.localeCompare(y.a))
  return feuds.map((r, i) => {
    const ha = home(world, r.a)
    const hb = home(world, r.b)
    return {
      key: `brink:${r.a}:${r.b}`,
      kind: 'brink' as const,
      icon: '😡',
      title: t('modes.story.brink', { a: tribeName(world, r.a), b: tribeName(world, r.b) }),
      detail: i === 0 && feuds.length > 1 ? t('modes.story.brink.worst') : t('modes.story.brink.feud'),
      weight: 40 + Math.round(-r.attitude * 30),
      at: ha && hb ? { x: (ha.x + hb.x) / 2, y: (ha.y + hb.y) / 2 } : (ha ?? hb),
      lineage: r.a,
      tribes: [r.a, r.b],
      action: { kind: 'show' as const },
    }
  })
}

export function perilStories(world: World, god = false): Story[] {
  return (world.tribes_in_peril ?? []).map((p) => {
    const help = PERIL_HELP[p.cause]
    const reason = capital(help?.reason ?? '')
    return {
      key: `peril:${p.lineage_id}`,
      kind: 'peril' as const,
      icon: '💀',
      title: t('modes.story.peril', { tribe: displayName(p.tribe), left: remainingLine(p.population) }),
      detail: god && help ? t('modes.story.peril.help', { reason, tool: toolLabel(help.tool) }) : reason,
      weight: (god ? 100 : 70) + Math.max(0, p.peak - p.population) - p.population,
      at: home(world, p.lineage_id),
      lineage: p.lineage_id,
      tribes: [p.lineage_id],
      action: god && help ? { kind: 'tool' as const, tool: help.tool } : { kind: 'show' as const },
    }
  })
}

/**
 * Faiths founded within the last half year: first seen after the world was
 * loaded, or founded in the events the frames still carry.
 */
export function faithStories(world: World, watch: StoryWatch): Story[] {
  const founded = (world.events ?? []).filter(
    (e) => (e.type as string) === 'religion_founded' && world.tick - e.tick < NEWS_TICKS,
  )
  return (world.religions ?? [])
    .filter((r) => {
      const seen = watch.faiths.get(r.id) ?? -Infinity
      if (world.tick - seen < NEWS_TICKS) return true
      return founded.some((e) => e.detail.includes(`founded ${r.name} (`))
    })
    .map((r) => {
      const lineage = r.founder_lineage ?? r.lineage_id
      const n = r.adherents ?? 0
      return {
        key: `faith:${r.id}`,
        kind: 'faith' as const,
        icon: '🔮',
        title: t('modes.story.faith', { faith: simFaithName(r.name) }),
        detail: lineage
          ? tn('modes.story.faith.detail', n, { tribe: tribeName(world, lineage) })
          : tn('modes.story.faith.believers', n),
        weight: 65 + Math.min(n, 30) / 3,
        at: home(world, lineage),
        lineage,
        tribes: lineage ? [lineage] : [],
        action: { kind: 'show' as const },
      }
    })
}

/** Tribes that have the people for their next era and lack at most one discovery. */
export function thresholdStories(world: World, god = false): Story[] {
  return (world.lineage_era_progress ?? [])
    .filter(
      (p) =>
        p.next_era &&
        p.pop_ready &&
        p.world_population_ready !== false &&
        p.missing.length <= 1 &&
        alive(world, p.lineage_id),
    )
    .map((p) => {
      const era = simLabel('era', p.next_era)
      const missing = p.missing[0]
      return {
        key: `threshold:${p.lineage_id}:${p.next_era}`,
        kind: 'threshold' as const,
        icon: '📜',
        title: t('modes.story.threshold', { tribe: tribeName(world, p.lineage_id) }),
        detail: god
          ? t('modes.story.threshold.god', { inspire: toolLabel('inspire') })
          : missing
            ? t('modes.story.threshold.missing', { era, discovery: simLabel('discovery', missing) })
            : t('modes.story.threshold.ready', { era }),
        weight: (god ? 20 : 30) + (missing ? 0 : 5),
        at: home(world, p.lineage_id),
        lineage: p.lineage_id,
        tribes: [p.lineage_id],
        action: { kind: 'show' as const },
      }
    })
}

/** Eras entered within the last half year: seen to change, or told by the events the frames still carry. */
export function eraStories(world: World, watch: StoryWatch): Story[] {
  // One story per tribe, its latest era: a small tribe can pass several in a season.
  const latest = new Map<string, { lineage: string; era: string; prev: string | null; tick: number }>()
  const byName = new Map(Object.entries(world.lineage_names ?? {}).map(([id, name]) => [name, id]))
  for (const e of world.events ?? []) {
    if ((e.type as string) !== 'era_advance' || world.tick - e.tick >= NEWS_TICKS) continue
    const era = /entered the (\S+) era/.exec(e.detail)?.[1]
    const lineage = byName.get(e.actor) ?? e.actor
    if (era && e.tick >= (latest.get(lineage)?.tick ?? -Infinity))
      latest.set(lineage, { lineage, era, prev: null, tick: e.tick })
  }
  for (const c of watch.eraChanges) {
    const told = latest.get(c.lineage)
    if (!told || c.tick >= told.tick || told.era === c.era) latest.set(c.lineage, c)
  }
  return [...latest.values()]
    .filter((c) => alive(world, c.lineage))
    .map((c) => ({
      key: `era:${c.lineage}:${c.era}`,
      kind: 'era' as const,
      icon: '🌅',
      title: t('modes.story.era', { era: simLabel('era', c.era) }),
      detail: c.prev
        ? t('modes.story.era.detail', { tribe: tribeName(world, c.lineage), prev: simLabel('era', c.prev) })
        : t('modes.story.era.tribe', { tribe: tribeName(world, c.lineage) }),
      weight: 60,
      at: home(world, c.lineage),
      lineage: c.lineage,
      tribes: [c.lineage],
      action: { kind: 'show' as const },
    }))
}

/** A settlement that just grew into a town; the world's only town is a quieter story. */
export function townStories(world: World, watch: StoryWatch): Story[] {
  const towns = (world.settlements ?? []).filter((s) => s.tier >= TOWN_TIER)
  return towns.flatMap((s) => {
    const rose = watch.townRises.some((r) => r.lineage === s.lineage_id)
    const only = towns.length === 1
    if (!rose && !only) return []
    return [
      {
        key: `town:${s.lineage_id}`,
        kind: 'town' as const,
        icon: '🏘️',
        title: t(only ? 'modes.story.town.first' : 'modes.story.town.new', { name: displayName(s.name) }),
        detail: tn('modes.story.town.detail', s.population, { tribe: tribeName(world, s.lineage_id) }),
        weight: rose ? 55 : 12,
        at: { x: s.center[0], y: s.center[1] },
        lineage: s.lineage_id,
        tribes: [s.lineage_id],
        action: { kind: 'show' as const },
      },
    ]
  })
}

export function outbreakStories(world: World, god = false): Story[] {
  return (world.active_outbreaks ?? []).map((o) => {
    const sick = tn('modes.story.outbreak.sick', o.infected ?? 0)
    const tribe = o.lineage_id ? t('modes.story.tribe', { tribe: tribeName(world, o.lineage_id) }) : null
    const at = home(world, o.lineage_id)
    return {
      key: `outbreak:${o.kind}:${o.lineage_id ?? ''}`,
      kind: 'outbreak' as const,
      icon: '🦠',
      title: t('modes.story.outbreak', { disease: simLabel('disease', o.kind) }),
      detail: god
        ? t('modes.story.outbreak.god', { cure: toolLabel('cure') })
        : [sick, tribe].filter(Boolean).join(' · '),
      weight: (god ? 70 : 50) + Math.min(o.infected ?? 0, 30),
      at,
      lineage: o.lineage_id,
      tribes: o.lineage_id ? [o.lineage_id] : [],
      action: god && at ? { kind: 'tool' as const, tool: 'cure' } : { kind: 'show' as const },
    }
  })
}

/**
 * One row per festival, however many tribes hold it: the season's feast comes
 * to every tribe at once. Two tribes are named, more are counted.
 */
export function festivalStories(world: World): Story[] {
  const byName = new Map<string, { at: { x: number; y: number }; tribes: string[] }>()
  for (const f of world.festivals ?? []) {
    if (typeof f.x !== 'number' || typeof f.y !== 'number') continue
    const row = byName.get(f.name) ?? { at: { x: f.x, y: f.y }, tribes: [] }
    if (f.lineage_id && !row.tribes.includes(f.lineage_id)) row.tribes.push(f.lineage_id)
    byName.set(f.name, row)
  }
  return [...byName].map(([name, { at, tribes }]) => {
    const named = tribes.length <= 2 ? tribes : []
    return {
      key: `festival:${name}`,
      kind: 'festival' as const,
      icon: '🎁',
      title: capital(simLabel('festival', name)),
      detail:
        tribes.length === 0
          ? ''
          : tribes.length === 1
            ? t('modes.story.festival.detail', { tribe: tribeName(world, tribes[0]) })
            : tribes.length === 2
              ? t('modes.story.festival.two', {
                  a: tribeName(world, tribes[0]),
                  b: tribeName(world, tribes[1]),
                })
              : tn('modes.story.festival.many', tribes.length),
      weight: 20 + Math.min(tribes.length, 6),
      at,
      lineage: tribes[0],
      tribes: named,
      action: { kind: 'show' as const },
    }
  })
}

/** The oldest person alive and the largest family: something to look at in a quiet world. */
export function fillerStories(world: World): Story[] {
  const out: Story[] = []
  let eldest: World['organisms'][number] | null = null
  for (const o of world.organisms) if (o.alive && (!eldest || o.age > eldest.age)) eldest = o
  if (eldest) {
    out.push({
      // One row for the title, whoever holds it: the eldest dying does not leave two "oldest".
      key: 'elder',
      kind: 'elder',
      icon: '⏳',
      title: t(eldest.sex === 'female' ? 'modes.story.elder.f' : 'modes.story.elder.m', {
        name: personName(eldest),
        age: ageInYears(eldest.age),
      }),
      detail: t('modes.story.tribe', { tribe: tribeName(world, eldest.lineage_id) }),
      weight: 5,
      at: { x: eldest.x, y: eldest.y },
      lineage: eldest.lineage_id,
      tribes: [eldest.lineage_id],
      person: eldest.id,
      action: { kind: 'show' },
    })
  }
  let best: { lineage: string; surname: string; living: number } | null = null
  for (const l of world.lineage_sizes ?? []) {
    const top = familyLines(world.organisms, l.id, 1)[0]
    if (top && top.living > 1 && (!best || top.living > best.living))
      best = { lineage: l.id, surname: top.surname, living: top.living }
  }
  if (best) {
    out.push({
      key: 'family',
      kind: 'family',
      icon: '👪',
      title: t('modes.story.family', { surname: displayName(best.surname) }),
      detail: tn('modes.story.family.detail', best.living, { tribe: tribeName(world, best.lineage) }),
      weight: 4,
      at: home(world, best.lineage),
      lineage: best.lineage,
      tribes: [best.lineage],
      action: { kind: 'show' },
    })
  }
  return out
}

export function observerStories(world: World, watch: StoryWatch): Story[] {
  return [
    ...warStories(world),
    ...brinkStories(world),
    ...perilStories(world),
    ...faithStories(world, watch),
    ...thresholdStories(world),
    ...eraStories(world, watch),
    ...townStories(world, watch),
    ...outbreakStories(world),
    ...festivalStories(world),
    ...fillerStories(world),
  ]
}

// ---------------------------------------------------------------- the god

/**
 * Prayers waiting for an answer, the one about to lapse first. A tribe that
 * prays for several things is one row, its most urgent prayer, with the rest
 * counted; rain asked by many tribes is one row too.
 */
export function prayerStories(world: World): Story[] {
  const rows: { row: PrayerRow; more: number }[] = []
  const byTribe = new Map<string, { row: PrayerRow; more: number }>()
  for (const row of prayerRows(world.prayers ?? [], world.tick)) {
    const lineage = row.count === 1 ? row.prayer.lineage_id : undefined
    const same = lineage ? byTribe.get(lineage) : undefined
    if (same) {
      same.more += 1
      continue
    }
    const entry = { row, more: 0 }
    if (lineage) byTribe.set(lineage, entry)
    rows.push(entry)
  }
  return rows.map(({ row, more }) => {
    const p = row.prayer
    const left = prayerTimeLeft(p, world.tick)
    const tool = PRAYER_KINDS[p.kind]?.tool
    const parts = [
      tool ? t('modes.story.prayer.tool', { tool: toolLabel(tool) }) : null,
      more > 0 ? tn('modes.story.prayer.more', more) : null,
      left < 0.35 ? t('modes.story.prayer.soon') : more > 0 ? null : t('modes.story.prayer.faith'),
    ]
    const tribe = row.count === 1 ? p.lineage_id : undefined
    return {
      key: tribe ? `prayer:tribe:${tribe}` : `prayer:${row.count > 1 ? p.kind : p.id}`,
      kind: 'prayer' as const,
      icon: PRAYER_KINDS[p.kind]?.icon ?? '🙏',
      title: row.count > 1 ? capital(prayerRowText(row)) : prayerPlea({ ...p, tribe: displayName(p.tribe) }),
      detail: parts.filter(Boolean).join('. '),
      weight: 80 + Math.round((1 - left) * 15),
      at: { x: p.x, y: p.y },
      lineage: p.lineage_id,
      tribes: tribe ? [tribe] : [],
      action: { kind: 'prayer' as const, prayer: p },
    }
  })
}

export function godStories(world: World): Story[] {
  return [
    ...perilStories(world, true),
    ...prayerStories(world),
    ...outbreakStories(world, true),
    ...warStories(world, true),
    ...thresholdStories(world, true),
  ]
}

/** The goal closest to done, for the god panel's foot. */
export function nearestGoal(goals: readonly GoalStatus[] | undefined): GoalStatus | null {
  const open = (goals ?? []).filter((g) => !g.done)
  if (open.length === 0) return null
  return open.reduce((a, b) =>
    b.progress / Math.max(1, b.target) > a.progress / Math.max(1, a.target) ? b : a,
  )
}

// ---------------------------------------------------------------- the rows shown

export const HOLD_MS = 20_000
export const MAX_ROWS = 5
export const MAX_PER_KIND = 2
export const MAX_PER_TRIBE = 2

export interface Shown {
  story: Story
  /** When the row appeared (ms). */
  since: number
}

/**
 * The rows the panel shows, from the rows it showed before and the stories of
 * now. A row stays at least HOLD_MS, even past its story's end, and rows keep
 * their order: new ones join at the bottom. At most MAX_ROWS rows,
 * MAX_PER_KIND of a kind and MAX_PER_TRIBE about one tribe; the oldest person
 * and the largest family only while fewer than three real stories are going on.
 */
export function pickStories(prev: readonly Shown[], stories: readonly Story[], now: number): Shown[] {
  const ranked = [...stories].sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
  const real = ranked.filter((s) => !FILLER_KINDS.has(s.kind)).length
  const fits = (rows: readonly Story[], s: Story) =>
    rows.filter((r) => r.kind === s.kind).length < MAX_PER_KIND &&
    (s.tribes ?? []).every((id) => rows.filter((r) => r.tribes?.includes(id)).length < MAX_PER_TRIBE)
  const wanted: Story[] = []
  for (const s of ranked) {
    if (wanted.length >= MAX_ROWS) break
    if (FILLER_KINDS.has(s.kind) && real >= 3) continue
    if (fits(wanted, s)) wanted.push(s)
  }
  const wantedKeys = new Set(wanted.map((s) => s.key))
  const byKey = new Map(stories.map((s) => [s.key, s]))
  const kept: Shown[] = prev
    .filter((row) => wantedKeys.has(row.story.key) || now - row.since < HOLD_MS)
    .map((row) => ({ story: byKey.get(row.story.key) ?? row.story, since: row.since }))
  for (const s of wanted) {
    if (kept.length >= MAX_ROWS) break
    const shown = kept.map((row) => row.story)
    if (shown.some((r) => r.key === s.key) || !fits(shown, s)) continue
    kept.push({ story: s, since: now })
  }
  return kept
}
