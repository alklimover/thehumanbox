import type { SimTable } from './types'

// How a person feels right now (`Organism::mood` in
// crates/sim-core/src/organism/organism/mood.rs). Russian names the feeling
// with a noun, so it reads the same for anyone: «настроение: страх».
export const mood: SimTable = {
  grieving: { ru: 'скорбь' },
  afraid: { ru: 'страх' },
  hungry: { ru: 'голод' },
  thirsty: { ru: 'жажда' },
  angry: { ru: 'гнев' },
  joyful: { ru: 'радость' },
  content: { ru: 'довольство' },
  calm: { ru: 'спокойствие' },
}
