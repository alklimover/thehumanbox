// Trade amounts in Russian. Upstream writes "4 clay" and "at 3 shells each" by
// putting the simulation's words after the number, which Russian cannot do: the
// noun takes its case from the number. In Russian these give the whole phrase;
// in any other language they give null and upstream's own text stays.
import { fmtNumber, ft, ftn, type ForkPluralKey } from '.'
import { getLocale } from './locale'
import { simLabel } from './sim'

/** The simulation's currency words (sim/civ/society/economy.rs). */
const CURRENCIES: Record<string, ForkPluralKey> = {
  shells: 'model.currency.shells',
  beads: 'model.currency.beads',
  coins: 'model.currency.coins',
  denarii: 'model.currency.denarii',
  florins: 'model.currency.florins',
  pounds: 'model.currency.pounds',
  dollars: 'model.currency.dollars',
  credits: 'model.currency.credits',
  tokens: 'model.currency.tokens',
  ergs: 'model.currency.ergs',
  creds: 'model.currency.creds',
  synth: 'model.currency.synth',
  stars: 'model.currency.stars',
  essence: 'model.currency.essence',
}

/** A held good and its count ("глина ×4"), or null outside Russian. */
export function heldGood(good: string, count: number): string | null {
  if (getLocale() !== 'ru') return null
  return ft('model.territory.goodItem', { count, good: simLabel('good', good) })
}

/** An amount in a tribe's coin ("4 ракушки"), or null outside Russian. */
export function coinAmount(n: number, coin: string | undefined): string | null {
  if (getLocale() !== 'ru') return null
  if (!coin) return fmtNumber(n)
  const key = CURRENCIES[coin]
  return key ? ftn(key, n) : ft('model.territory.money', { n, unit: coin })
}
