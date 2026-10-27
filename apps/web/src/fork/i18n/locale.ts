// The language of the fork's own text: simulation text, names, the fork's
// features. The player picks one language, with upstream's switcher
// (src/i18n): the fork's text is Russian when it is Russian and English for
// every other language, since the fork translates into Russian only.
//
// Upstream loads the chosen language before the first render, so like its
// t() this is read while rendering, never at module scope.
//
// The fork's default (Russian, whatever the browser or system language) is set
// where upstream picks the starting language: preferredLocale in src/i18n and
// public/splash-locale.js. Upstream keeps the choice under the key the fork
// used before ('thb-locale', "ru" or "en"), so a language picked before the
// move to upstream's translations stays as it was.
import { getLocale as activeLocale, loadLocale } from '../../i18n'

export type Locale = 'ru' | 'en'

export function isLocale(value: unknown): value is Locale {
  return value === 'ru' || value === 'en'
}

let workerLocale: Locale | null = null

export function getLocale(): Locale {
  if (workerLocale) return workerLocale
  return activeLocale() === 'ru' ? 'ru' : 'en'
}

/** BCP 47 tag for Intl. */
export function localeTag(locale: Locale = getLocale()): string {
  return locale === 'ru' ? 'ru-RU' : 'en-US'
}

/**
 * The simulation worker only: it loads no interface language, so the page
 * passes its language in the worker's start message and the worker sets it here.
 */
export function setWorkerLocale(locale: Locale) {
  workerLocale = locale
}

/** Tests only: switch the language (upstream's, and with it the fork's) without a reload. */
export async function setLocaleForTests(locale: Locale): Promise<void> {
  await loadLocale(locale)
}
