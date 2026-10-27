import { ft } from '../../fork/i18n'

/** "male" / "female" from the simulation, as words. */
export function sexLabel(sex: string): string {
  if (sex === 'male') return ft('life.sex.male')
  if (sex === 'female') return ft('life.sex.female')
  return sex
}
