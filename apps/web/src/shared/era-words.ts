import { t, type MessageKey } from '../i18n'
import { simWordFallback } from '../fork/i18n/sim'

// The bare name of each era the simulation sends ("stone", "bronze", ...). Where an age is meant, the
// interface wraps the name in its own phrase ("stone age", "Zeitalter Stein"), so the name stays short.
const ERA_KEYS = new Map<string, MessageKey>([
  ['pre-stone', 'model.words.era.preStone'],
  ['stone', 'model.words.era.stone'],
  ['bronze', 'model.words.era.bronze'],
  ['iron', 'model.words.era.iron'],
  ['classical', 'model.words.era.classical'],
  ['medieval', 'model.words.era.medieval'],
  ['renaissance', 'model.words.era.renaissance'],
  ['industrial', 'model.words.era.industrial'],
  ['modern', 'model.words.era.modern'],
  ['information', 'model.words.era.information'],
])

/** An era's bare name in the active language. An era it does not know is shown as its words. */
export function eraWord(era: string | null | undefined): string {
  if (!era) return ''
  const key = ERA_KEYS.get(era.replace(/_/g, '-'))
  // Fork: eras past the ten upstream names (fork/i18n/sim/era.ts).
  return key ? t(key) : simWordFallback('era', era, era.replace(/[-_]/g, ' '))
}
