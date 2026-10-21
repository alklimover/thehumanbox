// How unequally a tribe's wealth is shared, in words. The simulation sends a
// Gini coefficient per tribe (0 when everyone holds the same, near 1 when one
// person holds almost all of it); see sim/civ/society/inequality.rs.

import { t, type MessageKey } from '../../i18n'

export interface LineageInequality {
  lineage_id: string
  gini: number
  people: number
}

// Read after «богатство:» on the tribe card and the map's hover card, so Russian names the gap
// itself («резкий разрыв»). The stats chart words the same ids as bare adjectives for «разрыв».
const GAP_WORDS: Record<string, MessageKey> = {
  even: 'model.wealthGap.even',
  uneven: 'model.wealthGap.uneven',
  stark: 'model.wealthGap.stark',
}

/** The shown word for a wealth gap id from wealthGapLabel ("even", "uneven", "stark"). */
export function wealthGapWord(gap: string): string {
  const key = GAP_WORDS[gap]
  return key ? t(key) : gap
}

/** The id of the word for a Gini coefficient: how far the tribe's wealth is spread. */
export function wealthGapLabel(gini: number): string {
  if (gini < 0.3) return 'even'
  if (gini < 0.5) return 'uneven'
  return 'stark'
}

/** The wealth gap of one tribe, if the simulation reported it (tribes of four or more). */
export function wealthGapOf(rows: LineageInequality[] | undefined, lineage: string): string | null {
  const row = rows?.find((r) => r.lineage_id === lineage)
  return row ? wealthGapLabel(row.gini) : null
}
