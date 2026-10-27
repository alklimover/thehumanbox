// Text of the fork's own features (game modes, the whole chronicle, worlds and
// slots, the capacity meter, power and cores, the boot stages …) and the
// interface strings upstream leaves in English. Everything upstream translates
// goes through its t() (src/i18n) and its locale files; this catalog holds only
// what upstream has no key for. ft()/ftn() are named apart from upstream's t()
// so a call shows at a glance whose catalog it reads.
import type { Message } from './define'
import { CATALOGS, type ForkMessageKey, type ForkPluralKey } from './catalog'
import { getLocale, localeTag } from './locale'

export type { ForkMessageKey, ForkPluralKey } from './catalog'
export { getLocale, type Locale } from './locale'

export type Params = Record<string, string | number>

function lookup(key: string): Message | undefined {
  return CATALOGS[getLocale()][key] ?? CATALOGS.en[key]
}

function fill(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    if (value === undefined) return match
    return typeof value === 'number' ? fmtNumber(value) : value
  })
}

/** The fork's text for a key, with {name} placeholders filled from params. */
export function ft(key: ForkMessageKey, params?: Params): string {
  const message = lookup(key)
  if (message === undefined) return key
  return fill(typeof message === 'string' ? message : message.other, params)
}

const pluralRules = new Map<string, Intl.PluralRules>()

function pluralCategory(n: number): Intl.LDMLPluralRule {
  const tag = localeTag()
  let rules = pluralRules.get(tag)
  if (!rules) {
    rules = new Intl.PluralRules(tag)
    pluralRules.set(tag, rules)
  }
  return rules.select(n)
}

/** A counted phrase in the right plural form ("1 человек", "3 человека", "5 человек"); {n} is the count. */
export function ftn(key: ForkPluralKey, n: number, params?: Params): string {
  const message = lookup(key)
  if (message === undefined) return key
  const forms = typeof message === 'string' ? { other: message } : message
  const category = pluralCategory(n)
  const text = forms[category as keyof typeof forms] ?? forms.other
  return fill(text, { n, ...params })
}

/** A number the way the fork's text writes it ("12 345,6" in Russian); a missing one shows as a dash, as upstream's does. */
export function fmtNumber(n: number, options?: Intl.NumberFormatOptions): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '–'
  return n.toLocaleString(localeTag(), options)
}
