import { getLocale } from './locale'
import { simLabel } from './sim'
import { CONVERSATION_GLOSS } from './sim/concept'

/**
 * The simulation glosses a line in English, part by part ("Lupif · the hunt"). A part that is a
 * concept is shown in the player's language; any other part is a name and stays as it is.
 */
export function glossMeaning(meaning: string): string {
  if (getLocale() === 'en') return meaning
  return meaning
    .split(' · ')
    .map((part) => {
      const concept = CONVERSATION_GLOSS[part]
      return concept ? simLabel('concept', concept) : part
    })
    .join(' · ')
}
