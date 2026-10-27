// Fork: how a world on disk is named and described in the worlds list (WorldsSection.tsx).
import { ft, fmtNumber } from './i18n'
import { localeTag } from './i18n/locale'
import type { WorldSlot } from '../shared/desktop'

function date(ms: number): string {
  return new Date(ms).toLocaleString(localeTag(), { dateStyle: 'medium', timeStyle: 'short' })
}

/** How a world is called in the list: its name, or the day it was made. */
export function worldTitle(w: WorldSlot): string {
  return w.name ?? ft('worlds.unnamed', { date: date(w.createdAt ?? w.savedAt) })
}

/** The line under a world's name: when it was saved, how big it is, its seed when known. */
export function worldFacts(w: WorldSlot): string {
  return [
    ft('worlds.saved', { date: date(w.savedAt) }),
    ft('worlds.size', { mb: fmtNumber(w.sizeBytes / 1_048_576, { maximumFractionDigits: 1 }) }),
    w.seed ? ft('worlds.seed', { seed: w.seed }) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
