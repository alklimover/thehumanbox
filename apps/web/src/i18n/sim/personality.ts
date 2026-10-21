import type { SimTable } from './types'

// Personality in words (`personality_words` in
// crates/sim-core/src/organism/personality.rs). Nouns, as for attributes, so
// the chip fits a man and a woman alike.
export const personality: SimTable = {
  brave: { ru: 'храбрость' },
  shy: { ru: 'застенчивость' },
  curious: { ru: 'любопытство' },
  fierce: { ru: 'свирепость' },
  kind: { ru: 'доброта' },
}
