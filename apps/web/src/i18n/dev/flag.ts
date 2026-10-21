// When the untranslated-text check runs (see ./index).
import type { Locale } from '../locale'

export const I18N_CHECK_STORAGE_KEY = 'thb-i18n-check'

export function i18nCheckWanted(env: {
  dev: boolean
  locale: Locale
  search: string
  stored: string | null
}): boolean {
  const param = new URLSearchParams(env.search).get('i18n-check')
  if (param === '0' || param === '1') return param === '1'
  if (env.stored === '1') return true
  return env.dev && env.locale === 'ru'
}
