import type { SimTable } from './types'

/**
 * A tribe's seasonal festival (`FestivalInfo.name`): `festival_for_season()` in
 * crates/sim-core/src/sim/civ/society/festivals.rs. The simulation sends the
 * English name as it is; it reads after «идёт праздник:».
 */
export const festival: SimTable = {
  'Midsummer Fair': { ru: 'летняя ярмарка' },
  'Harvest Feast': { ru: 'праздник урожая' },
  'Midwinter Feast': { ru: 'зимний пир' },
  'Spring Festival': { ru: 'весенний праздник' },
}
