import type { SimTable } from './types'

/**
 * Illnesses a person can carry (`diseases[].kind`): `DiseaseKind::name()` in
 * crates/sim-core/src/sim/tech/medicine.rs, plus the seasonal fever/flu/influenza
 * of crates/sim-core/src/sim/seasons.rs and the plague of the plague power.
 */
export const disease: SimTable = {
  cold: { ru: 'простуда' },
  flu: { ru: 'грипп' },
  fever: { ru: 'лихорадка' },
  plague: { ru: 'мор' },
  cholera: { ru: 'холера' },
  pox: { ru: 'оспа' },
  tuberculosis: { ru: 'туберкулёз' },
  influenza: { ru: 'инфлюэнца' },
  malaria: { ru: 'малярия' },
  scurvy: { ru: 'цинга' },
}
