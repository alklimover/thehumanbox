// An age in years in Russian, declined with the number («30 лет», «21 год», «1,4 года»). Upstream
// writes one form for every number ("{years} yrs"); ageInYears (game/model/calendar.ts) asks here
// first, and keeps upstream's text in any other language.
import { ft, ftn } from '.'
import { getLocale } from './locale'

/** `years` is the age in years; `shown` is upstream's formatted number. Null outside Russian. */
export function ageInYearsRu(years: number, shown: string): string | null {
  if (getLocale() !== 'ru') return null
  if (years >= 10) return ftn('calendar.ageYears', Math.floor(years))
  return ft('calendar.ageDecimal', { years: shown })
}
