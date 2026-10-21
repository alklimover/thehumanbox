// Titles shown beside a person's name: what they are to their tribe. They
// come from the state the simulation already sends (the tribe's ruler, age,
// and the trade a person has taken up), so a title is never a separate fact.

import { t, type MessageKey } from '../../i18n'
import { simLabel } from '../../i18n/sim'

/** A trade's title for a man and for a woman (Russian says «охотник» and «охотница»). */
const TRADE_TITLES: Record<string, [MessageKey, MessageKey]> = {
  healer: ['model.title.healer', 'model.titleFemale.healer'],
  doctor: ['model.title.doctor', 'model.titleFemale.doctor'],
  hunter: ['model.title.hunter', 'model.titleFemale.hunter'],
  farmer: ['model.title.farmer', 'model.titleFemale.farmer'],
  builder: ['model.title.builder', 'model.titleFemale.builder'],
  soldier: ['model.title.soldier', 'model.titleFemale.soldier'],
  priest: ['model.title.priest', 'model.titleFemale.priest'],
  scholar: ['model.title.scholar', 'model.titleFemale.scholar'],
  baker: ['model.title.baker', 'model.titleFemale.baker'],
  miner: ['model.title.miner', 'model.titleFemale.miner'],
  merchant: ['model.title.merchant', 'model.titleFemale.merchant'],
  artist: ['model.title.artist', 'model.titleFemale.artist'],
}

/** The titles for a living person, in the order they are shown. The dead keep no title. */
export function personTitles(org: {
  alive: boolean
  is_elder: boolean
  is_leader?: boolean
  specialty?: string
  sex?: string
}): string[] {
  if (!org.alive) return []
  const titles: string[] = []
  if (org.is_leader) titles.push(t('model.title.chief'))
  if (org.is_elder) titles.push(t('model.title.elder'))
  if (org.specialty) {
    const trade = org.specialty.toLowerCase()
    const keys = TRADE_TITLES[trade]
    if (keys) titles.push(t(keys[org.sex === 'female' ? 1 : 0]))
    else {
      const name = simLabel('specialty', trade)
      titles.push(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }
  return titles
}
