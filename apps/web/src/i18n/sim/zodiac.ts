import type { SimTable } from './types'

// The twelve birth signs (`ZodiacSign::label` in crates/sim-core/src/sim/cosmos.rs).
// Their one-line flavour is in catalog/people.ts (`people.zodiacFlavor.<id>`).
export const zodiac: SimTable = {
  ember: { ru: 'жар' },
  wave: { ru: 'волна' },
  stone: { ru: 'камень' },
  root: { ru: 'корень' },
  bough: { ru: 'ветвь' },
  crane: { ru: 'журавль' },
  wolf: { ru: 'волк' },
  dawn: { ru: 'заря' },
  hearth: { ru: 'очаг' },
  veil: { ru: 'покров' },
  spear: { ru: 'копьё' },
  seed: { ru: 'зерно' },
}
