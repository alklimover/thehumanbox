import type { SimTable } from './types'

/** Treaties between tribes: `TreatyKind::name()` in crates/sim-core/src/sim/civ/society/warfare/types.rs. */
export const treaty: SimTable = {
  non_aggression: { ru: 'пакт о ненападении' },
  alliance: { ru: 'союз' },
  trade: { ru: 'торговый договор' },
  defensive: { ru: 'оборонительный союз' },
  vassalage: { ru: 'вассалитет' },
}
