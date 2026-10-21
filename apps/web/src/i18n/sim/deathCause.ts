import type { SimTable } from './types'

// Why a person died (`death_cause`, set in
// crates/sim-core/src/sim/simulation/organism_tick/mortality.rs and, for
// battles, sim/civ/society/warfare/battles.rs). Nominative noun phrases that
// read after «Причина смерти:».
export const deathCause: SimTable = {
  'old age': { ru: 'старость' },
  starvation: { ru: 'голод' },
  dehydration: { ru: 'жажда' },
  sickness: { ru: 'болезнь' },
  beasts: { ru: 'нападение зверей' },
  drowning: { ru: 'утопление' },
  fire: { ru: 'огонь' },
  disaster: { ru: 'стихийное бедствие' },
  war: { ru: 'война' },
  combat: { ru: 'схватка' },
  murder: { ru: 'убийство' },
  executed: { ru: 'казнь' },
}
