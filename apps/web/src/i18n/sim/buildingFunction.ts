import type { SimTable } from './types'

/** What a building is for: `BuildingFunction::label()` in crates/sim-core/src/sim/tech/buildings/profile.rs. */
export const buildingFunction: SimTable = {
  housing: { ru: 'жильё' },
  education: { ru: 'образование' },
  worship: { ru: 'богослужение' },
  trade: { ru: 'торговля' },
  industry: { ru: 'промышленность' },
  healthcare: { ru: 'здравоохранение' },
  military: { ru: 'военное дело' },
  civic: { ru: 'управление' },
  infrastructure: { ru: 'инфраструктура' },
  recreation: { ru: 'досуг' },
}
