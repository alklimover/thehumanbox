// Switches on the check for English left on the Russian screen (./detector).
// It runs in the dev server with the Russian interface, and anywhere — a
// production or desktop build included — with ?i18n-check=1 in the address or
// localStorage 'thb-i18n-check' set to '1'; ?i18n-check=0 turns it off. When it
// is off, this flag check is all it costs: the detector is never loaded.
import { getLocale } from '../locale'
import { I18N_CHECK_STORAGE_KEY, i18nCheckWanted } from './flag'

function storedFlag(): string | null {
  try {
    return window.localStorage.getItem(I18N_CHECK_STORAGE_KEY)
  } catch {
    return null
  }
}

if (
  typeof window !== 'undefined' &&
  i18nCheckWanted({
    dev: import.meta.env.DEV,
    locale: getLocale(),
    search: window.location.search,
    stored: storedFlag(),
  })
) {
  void import('./detector').then((m) => m.startI18nCheck())
}
