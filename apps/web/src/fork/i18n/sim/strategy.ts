import type { SimTable } from './types'

/** The course a god sets for a tribe (`lineage_strategies[].strategy`): see crates/sim-core/src/sim/command/tribes.rs. */
export const strategy: SimTable = {
  hunt: { ru: 'добыча пищи' },
  explore: { ru: 'разведка' },
  settle: { ru: 'обустройство' },
  trade: { ru: 'торговля' },
  defend: { ru: 'оборона' },
}
