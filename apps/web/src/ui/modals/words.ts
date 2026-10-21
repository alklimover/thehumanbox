import { t } from '../../i18n'

/** "male" / "female" from the simulation, as words. */
export function sexLabel(sex: string): string {
  if (sex === 'male') return t('life.sex.male')
  if (sex === 'female') return t('life.sex.female')
  return sex
}
