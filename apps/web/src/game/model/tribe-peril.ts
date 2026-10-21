import { t } from '../../i18n'
import type { PerilCause, TribePeril, WorldState } from '../../shared/types'

/** What is killing a tribe, and the power that helps most. */
export const PERIL_HELP: Record<PerilCause, { reason: string; tool: string; action: string }> = {
  sickness: { reason: t('peril.reason.sickness'), tool: 'cure', action: t('peril.action.cure') },
  hunger: { reason: t('peril.reason.hunger'), tool: 'harvest', action: t('peril.action.harvest') },
  thirst: { reason: t('peril.reason.thirst'), tool: 'rain', action: t('peril.action.rain') },
  no_children: { reason: t('peril.reason.no_children'), tool: 'spawn1', action: t('peril.action.newcomer') },
  old_age: { reason: t('peril.reason.old_age'), tool: 'spawn1', action: t('peril.action.youngBlood') },
  dwindling: { reason: t('peril.reason.dwindling'), tool: 'bless', action: t('peril.action.bless') },
  war: { reason: t('peril.reason.war'), tool: 'peace', action: t('peril.action.peace') },
  beasts: { reason: t('peril.reason.beasts'), tool: 'banish', action: t('peril.action.banish') },
  drowning: { reason: t('peril.reason.drowning'), tool: 'grass', action: t('peril.action.land') },
  fire: { reason: t('peril.reason.fire'), tool: 'douse', action: t('peril.action.douse') },
  disaster: { reason: t('peril.reason.disaster'), tool: 'bless', action: t('peril.action.bless') },
}

export function perilOf(world: Pick<WorldState, 'tribes_in_peril'>, lineage: string): TribePeril | null {
  return world.tribes_in_peril?.find((p) => p.lineage_id === lineage) ?? null
}

/** "only 3 left", "the last one" */
export function remainingLine(population: number): string {
  // "The last one" is about exactly one person, so this is not a plural form (Russian "one" also covers 21).
  return population === 1 ? t('peril.lastOne') : t('peril.onlyLeft', { n: population })
}

/** Rows to show in the panel: every tribe on the brink, then the largest. */
export function visibleLineages<T extends { count: number; peril?: unknown }>(
  rows: readonly T[],
  limit = 5,
): T[] {
  const sorted = [...rows].sort(
    (a, b) => Number(!!b.peril) - Number(!!a.peril) || (a.peril ? a.count - b.count : b.count - a.count),
  )
  const endangered = sorted.filter((r) => r.peril).length
  return sorted.slice(0, Math.max(limit, endangered))
}

/** Where a tribe lives: its settlement, or the middle of its people. */
export function tribeHome(
  world: Pick<WorldState, 'settlements' | 'organisms'>,
  lineage: string,
): { x: number; y: number } | null {
  const home = world.settlements?.find((s) => s.lineage_id === lineage)
  if (home) return { x: home.center[0], y: home.center[1] }
  const people = world.organisms.filter((o) => o.alive !== false && o.lineage_id === lineage)
  if (people.length === 0) return null
  return {
    x: people.reduce((n, o) => n + o.x, 0) / people.length,
    y: people.reduce((n, o) => n + o.y, 0) / people.length,
  }
}

/** How each cause of death reads on a tribe card. */
const LOSS_WORDS: Record<string, string> = {
  war: 'war',
  combat: 'fights',
  beasts: 'beasts',
  drowning: 'drowning',
  fire: 'fire',
  disaster: 'disaster',
  sickness: 'sickness',
  starvation: 'hunger',
  dehydration: 'thirst',
  old_age: 'old age',
}

/** "3 to war · 1 to old age", worst first; null when nobody died lately. */
export function lossLine(losses: Record<string, number> | undefined): string | null {
  const rows = Object.entries(losses ?? {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  if (rows.length === 0) return null
  return rows
    .slice(0, 3)
    .map(([cause, n]) => `${n} to ${LOSS_WORDS[cause] ?? cause.replace(/_/g, ' ')}`)
    .join(' · ')
}
