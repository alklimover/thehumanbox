import { tn } from '../../../i18n'

export const DAY_LENGTH = 600

/** A span of ticks in whole days: "1 day", "12 days". */
export function fmt(ticks: number) {
  return tn('person.days', Math.floor(ticks / DAY_LENGTH))
}
