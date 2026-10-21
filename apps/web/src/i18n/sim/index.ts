// Display names for ids that come from the simulation (eras, buildings,
// discoveries, goods …). The simulation keeps sending English ids — they are
// logic keys there and in the client — and only what is shown is translated.
// An id missing from a table falls back to the English id with its separators
// turned into spaces, which is what the game showed before translation.
import { getLocale } from '../locale'
import { SIM_TABLES, type SimDomain } from './tables'

export type { SimDomain } from './tables'

/** "stone_age" → "stone age", "kardashev-2" → "kardashev 2". */
export function prettifyId(id: string): string {
  return id.replace(/[_-]+/g, ' ').trim()
}

let missListener: ((domain: SimDomain, id: string) => void) | null = null

/** The untranslated-text check (i18n/dev) hears here about ids no table knows. */
export function onSimLabelMiss(listener: ((domain: SimDomain, id: string) => void) | null) {
  missListener = listener
}

/** The name to show for a simulation id of the given kind. */
export function simLabel(domain: SimDomain, id: string | null | undefined): string {
  if (!id) return ''
  const entry = SIM_TABLES[domain][id] ?? SIM_TABLES[domain][id.toLowerCase()]
  if (!entry) {
    missListener?.(domain, id)
    return prettifyId(id)
  }
  if (getLocale() === 'ru') return entry.ru
  return entry.en ?? prettifyId(id)
}

/** Whether a table knows this id (for coverage checks and dev warnings). */
export function hasSimLabel(domain: SimDomain, id: string): boolean {
  return id in SIM_TABLES[domain]
}
