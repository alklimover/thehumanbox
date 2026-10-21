import { t, tn } from '../../i18n'
import type { PrayerInfo } from '../../shared/types'

/**
 * What each prayer asks for, and which tool answers it. `plea` is what they (the tribe's people)
 * ask, "pray for food"; `pleaOne` is the same said of one tribe, which Russian puts in the singular.
 */
export const PRAYER_KINDS: Record<string, { plea: string; pleaOne: string; tool: string; icon: string }> = {
  hunger: {
    plea: t('prayers.plea.hunger'),
    pleaOne: t('prayers.pleaOne.hunger'),
    tool: 'harvest',
    icon: '🌾',
  },
  thirst: {
    plea: t('prayers.plea.thirst'),
    pleaOne: t('prayers.pleaOne.thirst'),
    tool: 'drink',
    icon: '💧',
  },
  sickness: {
    plea: t('prayers.plea.sickness'),
    pleaOne: t('prayers.pleaOne.sickness'),
    tool: 'cure',
    icon: '💊',
  },
  danger: {
    plea: t('prayers.plea.danger'),
    pleaOne: t('prayers.pleaOne.danger'),
    tool: 'banish',
    icon: '🛡️',
  },
  rain: { plea: t('prayers.plea.rain'), pleaOne: t('prayers.pleaOne.rain'), tool: 'rain', icon: '🌧️' },
  children: {
    plea: t('prayers.plea.children'),
    pleaOne: t('prayers.pleaOne.children'),
    tool: 'love',
    icon: '❤️',
  },
  peace: { plea: t('prayers.plea.peace'), pleaOne: t('prayers.pleaOne.peace'), tool: 'peace', icon: '🕊️' },
  knowledge: {
    plea: t('prayers.plea.knowledge'),
    pleaOne: t('prayers.pleaOne.knowledge'),
    tool: 'inspire',
    icon: '💡',
  },
  shelter: {
    plea: t('prayers.plea.shelter'),
    pleaOne: t('prayers.pleaOne.shelter'),
    tool: 'shelter',
    icon: '🛖',
  },
  fire: { plea: t('prayers.plea.fire'), pleaOne: t('prayers.pleaOne.fire'), tool: 'douse', icon: '🪣' },
}

export function prayerTool(kind: string): string | null {
  return PRAYER_KINDS[kind]?.tool ?? null
}

export function prayerPlea(p: Pick<PrayerInfo, 'kind' | 'tribe'>): string {
  const plea = PRAYER_KINDS[p.kind]?.pleaOne ?? t('prayers.pleaOne.fallback')
  return p.tribe ? t('prayers.byTribe', { tribe: p.tribe, plea }) : t('prayers.someTribe', { plea })
}

/** Share of the prayer's time still left, 0..1. */
export function prayerTimeLeft(p: Pick<PrayerInfo, 'created' | 'expires'>, tick: number): number {
  const span = Math.max(1, p.expires - p.created)
  return Math.max(0, Math.min(1, (p.expires - tick) / span))
}

/** Prayers one world-wide power answers for everyone at once. */
const GLOBAL_KINDS = new Set(['rain'])

export interface PrayerRow {
  prayer: PrayerInfo
  count: number
}

/**
 * Rows for the prayer list, most urgent first. World-wide needs (rain) are
 * one row however many tribes ask, since one answer covers them all.
 */
export function prayerRows(prayers: readonly PrayerInfo[], tick: number): PrayerRow[] {
  const rows: PrayerRow[] = []
  const grouped = new Map<string, PrayerRow>()
  for (const prayer of sortPrayers(prayers, tick)) {
    if (!GLOBAL_KINDS.has(prayer.kind)) {
      rows.push({ prayer, count: 1 })
      continue
    }
    const row = grouped.get(prayer.kind)
    if (row) row.count += 1
    else {
      const fresh = { prayer, count: 1 }
      grouped.set(prayer.kind, fresh)
      rows.push(fresh)
    }
  }
  return rows
}

export function prayerRowText(row: PrayerRow): string {
  if (row.count <= 1) return prayerPlea(row.prayer)
  // Rain is the one need several tribes share (GLOBAL_KINDS); its own message lets the verb agree with the count.
  if (row.prayer.kind === 'rain') return tn('prayers.tribes.rain', row.count)
  return tn('prayers.tribes', row.count, {
    plea: PRAYER_KINDS[row.prayer.kind]?.plea ?? t('prayers.plea.fallback'),
  })
}

/** Most urgent first: the prayer closest to lapsing. */
export function sortPrayers(prayers: readonly PrayerInfo[], tick: number): PrayerInfo[] {
  return [...prayers].sort((a, b) => prayerTimeLeft(a, tick) - prayerTimeLeft(b, tick) || a.id - b.id)
}
