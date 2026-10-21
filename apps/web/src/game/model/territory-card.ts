import type { WorldState } from '../../shared/types'
import { wealthGapOf, wealthGapWord } from './inequality'
import { leadershipOf } from './leadership'
import { fmtNumber, t, tn, type MessageKey, type PluralKey } from '../../i18n'
import { cargoLabel, simLabel } from '../../i18n/sim'

/** What the hover card says about a tribe whose land the pointer rests on. */
export interface TerritoryCardFacts {
  name: string
  people: number
  leader: string | null
  government: string | null
  era: string | null
  wealthGap: string | null
  trade: string | null
  goods: string | null
  contested: boolean
}

/**
 * The land goods a tribe holds (clay, salt, ore, ...), most first, in a few words. Null when
 * its people hold none, so a tribe whose ground gives nothing shows nothing.
 */
export function goodsOfTribe(world: Pick<WorldState, 'land_goods'>, lineage: string): string | null {
  const held = world.land_goods?.[lineage] ?? {}
  const parts = Object.entries(held)
    .filter(([, count]) => count > 0)
    .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB))
    .map(([good, count]) => t('model.territory.goodItem', { count, good: simLabel('good', good) }))
  return parts.length > 0 ? t('model.territory.holds', { goods: parts.join(', ') }) : null
}

/**
 * A tribe's trade in a few words: the routes it is on, the goods those routes
 * have carried, the caravans on the road to or from it, and the price of the
 * goods on their way in (a scarce good sells dearer). Null while the tribe has
 * no route, so a tribe that does not trade shows nothing.
 */
/** The town a tribe is known for, in words ("a mining town"), or null when it has no specialty. */
export function specialtyOfTribe(world: Pick<WorldState, 'specialties'>, lineage: string): string | null {
  const good = world.specialties?.[lineage]
  if (!good) return null
  const town = TOWNS[good]
  return town ? t(town) : null
}

const TOWNS: Record<string, MessageKey> = {
  ore: 'model.territory.town.ore',
  salt: 'model.territory.town.salt',
  clay: 'model.territory.town.clay',
  spice: 'model.territory.town.spice',
  ochre: 'model.territory.town.ochre',
  fur: 'model.territory.town.fur',
}

/** The simulation's currency words (sim/civ/society/economy.rs), counted in the reader's language. */
const CURRENCIES: Record<string, PluralKey> = {
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

/** An amount in a tribe's coin ("4 shells"), or the bare number when the coin is not known. */
function money(n: number, unit: string | undefined): string {
  if (!unit) return fmtNumber(n)
  const key = CURRENCIES[unit]
  return key ? tn(key, n) : t('model.territory.money', { n, unit })
}

export function tradeOfTribe(
  world: Pick<
    WorldState,
    'trade_routes' | 'caravans' | 'trade_income' | 'trade_barter' | 'lineage_currencies'
  >,
  lineage: string,
): string | null {
  const routes = (world.trade_routes ?? []).filter(
    (route) => route.lineage_a === lineage || route.lineage_b === lineage,
  )
  if (routes.length === 0) return null
  // The coin of the tribe's age ("beads" in the Bronze age, "coins" in the Iron age), when known.
  const unit = world.lineage_currencies?.[lineage] || undefined
  const goods = routes.reduce((sum, route) => sum + route.volume, 0)
  const caravans = (world.caravans ?? []).filter(
    (caravan) => caravan.sender_lineage === lineage || caravan.receiver_lineage === lineage,
  )
  const inbound = caravans.find((caravan) => caravan.receiver_lineage === lineage)
  const parts = [tn('model.territory.routes', routes.length)]
  if (routes.some((route) => route.embargoed)) parts.push(t('model.territory.embargoed'))
  else if (routes.some((route) => route.agreement)) parts.push(t('model.territory.agreement'))
  // A first caravan still on the road has delivered nothing yet, so no goods are named.
  if (goods > 0) parts.push(tn('model.territory.goods', goods))
  if (caravans.length > 0) parts.push(tn('model.territory.caravans', caravans.length))
  if (inbound)
    parts.push(
      t('model.territory.buying', {
        cargo: cargoLabel(inbound.cargo),
        price: money(inbound.unit_price, unit),
      }),
    )
  const earned = world.trade_income?.[lineage] ?? 0
  if (earned > 0) parts.push(t('model.territory.earned', { money: money(earned, unit) }))
  const bartered = world.trade_barter?.[lineage] ?? 0
  if (bartered > 0) parts.push(t('model.territory.bartered', { n: bartered }))
  return parts.join(' · ')
}

/** A tribe's era in words, from the simulation's lineage eras (a list of rows or a map). */
export function eraNameOf(world: Pick<WorldState, 'lineage_eras'>, lineage: string): string | null {
  const eras = world.lineage_eras
  if (!eras) return null
  const raw = Array.isArray(eras) ? eras.find((row) => row.lineage_id === lineage)?.era_name : eras[lineage]
  // Pretty-printed English ("pre stone"); the hover card names it through simLabel('era').
  return raw ? raw.replace(/[-_]/g, ' ') : null
}

/** The facts a tribe's territory card shows: name, people alive, who leads it, its era and wealth gap. */
export function territoryCardFacts(
  world: WorldState,
  lineage: string,
  contested: boolean,
): TerritoryCardFacts {
  const leadership = leadershipOf(world, lineage)
  const gap = wealthGapOf(world.lineage_inequality, lineage)
  return {
    name: world.lineage_names?.[lineage] ?? lineage,
    people: world.organisms.filter((o) => o.alive && o.lineage_id === lineage).length,
    leader: leadership?.leader?.name ?? null,
    government: leadership?.government ?? null,
    era: eraNameOf(world, lineage),
    wealthGap: gap ? wealthGapWord(gap) : null,
    trade:
      [specialtyOfTribe(world, lineage), tradeOfTribe(world, lineage)].filter(Boolean).join(' · ') || null,
    goods: goodsOfTribe(world, lineage),
    contested,
  }
}
