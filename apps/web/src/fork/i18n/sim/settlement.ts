import type { SimTable } from './types'

/**
 * Settlement tiers (`tier_name`): `TIER_NAMES` in crates/sim-core/src/sim/civ/society/settlements.rs,
 * and the towns a tribe's specialty makes of it: `specialty_town()` in
 * crates/sim-core/src/sim/civ/society/trade_routes/specialty.rs ("mining town" …).
 */
export const settlement: SimTable = {
  wilderness: { ru: 'дикие земли' },
  camp: { ru: 'стоянка' },
  hamlet: { ru: 'хутор' },
  village: { ru: 'деревня' },
  town: { ru: 'город' },
  city: { ru: 'большой город' },

  'mining town': { ru: 'город горняков' },
  'salt town': { ru: 'город солеваров' },
  'pottery town': { ru: 'город гончаров' },
  'spice town': { ru: 'город пряностей' },
  'ochre town': { ru: 'город охры' },
  'fur town': { ru: 'город пушнины' },
}
