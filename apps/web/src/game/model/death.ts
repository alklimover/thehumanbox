// How a person's death is worded on their card. The simulation records the
// cause when the person dies (crates/sim-core/src/sim/simulation/organism_tick/
// mortality.rs), as "starvation", "combat", "old age" and so on.

import { tn } from '../../i18n'
import { simLabel } from '../../i18n/sim'

/** The sentence for a dead person's card, or null while they are alive or the cause is unknown. */
export function deathLine(org: {
  alive: boolean
  death_cause?: string
  age: number
  sex?: string
}): string | null {
  if (org.alive || !org.death_cause) return null
  // Russian puts the verb in the person's gender; without a known sex the line is worded neutrally.
  const key =
    org.sex === 'female'
      ? 'model.death.lineFemale'
      : org.sex === 'male'
        ? 'model.death.lineMale'
        : 'model.death.line'
  return tn(key, org.age, { cause: simLabel('deathCause', org.death_cause) })
}
