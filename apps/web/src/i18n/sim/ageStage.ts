import type { SimTable } from './types'

// Stages of life (`AgeStage::name` in crates/sim-core/src/sim/agents/age_stage.rs).
// Named as stages, not as people («старость», not «старик»), so they fit anyone.
export const ageStage: SimTable = {
  infant: { ru: 'младенчество' },
  child: { ru: 'детство' },
  teen: { ru: 'юность' },
  adult: { ru: 'зрелость' },
  elder: { ru: 'старость' },
}
