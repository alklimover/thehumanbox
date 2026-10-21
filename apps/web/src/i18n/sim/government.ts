import type { SimTable } from './types'

/** Forms of rule: `GovernmentKind::name()` in crates/sim-core/src/sim/civ/society/government.rs. */
export const government: SimTable = {
  tribal: { ru: 'родоплеменной строй' },
  chiefdom: { ru: 'вождество' },
  monarchy: { ru: 'монархия' },
  theocracy: { ru: 'теократия' },
  republic: { ru: 'республика' },
  democracy: { ru: 'демократия' },
  empire: { ru: 'империя' },
  federation: { ru: 'федерация' },
  corporate: { ru: 'корпоратократия' },
}
