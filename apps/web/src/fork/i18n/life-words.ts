// Words of the life window (LifeModal) that upstream shows as the simulation sends them: the
// categories of life events, the emotional state of the life summary and the kinds of memory.
import { ft, type ForkMessageKey } from '.'
import { simLabel } from './sim'

const CATEGORY: Record<string, ForkMessageKey> = {
  love: 'life.category.love',
  loss: 'life.category.loss',
  birth: 'life.category.birth',
  friendship: 'life.category.friendship',
  discovery: 'life.category.discovery',
  achievement: 'life.category.achievement',
  trauma: 'life.category.trauma',
  witnessed: 'life.category.witnessed',
  aspiration: 'life.category.aspiration',
  partnership: 'life.category.partnership',
  courtship: 'life.category.courtship',
  farewell: 'life.category.farewell',
  danger: 'life.category.danger',
  specialty: 'life.category.specialty',
  graduated: 'life.category.graduated',
  religion: 'life.category.religion',
  milestone: 'life.category.milestone',
  elder: 'life.category.elder',
  death: 'life.category.death',
  betrayal: 'life.category.betrayal',
  event: 'life.category.event',
}

/** The name of a life-event category; one the client does not know shows as the simulation sends it. */
export function lifeCategory(category: string): string {
  const key = CATEGORY[category]
  return key ? ft(key) : category
}

// The life summary's emotional state (OrgLife::emotional_state in sim-core's organism/json.rs). These
// are not the person's mood ids, so they have their own words; anything else goes through the mood table.
const FEELING: Record<string, ForkMessageKey> = {
  devastated: 'life.state.devastated',
  grieving: 'life.state.grieving',
  'desperately lonely': 'life.state.desperatelyLonely',
  terrified: 'life.state.terrified',
  lonely: 'life.state.lonely',
  content: 'life.state.content',
  restless: 'life.state.restless',
  starving: 'life.state.starving',
  stable: 'life.state.stable',
}

export function lifeFeeling(state: string): string {
  const key = FEELING[state]
  return key ? ft(key) : simLabel('mood', state)
}

const MEMORY_KIND: Record<string, ForkMessageKey> = {
  core: 'life.memory.core',
  episode: 'life.memory.episode',
  fact: 'life.memory.fact',
  bond: 'life.memory.bond',
  place: 'life.memory.place',
  dream: 'life.memory.dream',
}

export function memoryKind(kind: string): string {
  const key = MEMORY_KIND[kind]
  return key ? ft(key) : kind
}
