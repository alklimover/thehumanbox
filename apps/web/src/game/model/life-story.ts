// A readable life story for the person card: a few plain sentences built from
// what the client already knows about someone (their parents, partner,
// children, trade, how they died) and their most telling life events. Nothing
// here is a new fact; it only puts the existing ones into words.

import { t, tn, type PluralKey } from '../../i18n'
import { simLabel } from '../../i18n/sim'
import { sexOf, simText } from '../../i18n/simtext'
import { personName } from '../../shared/personName'

/** A day in ticks, the same as DAY_LENGTH in ui/panels/org-detail/format.ts. */
const DAY_TICKS = 600

export interface StoryPerson {
  id: string
  name: string
  custom_name?: string | null
  alive: boolean
  age: number
  sex?: string
  generation: number
  parent_id?: string | null
  father_id?: string | null
  partner_id?: string | null
  children_count?: number
  specialty?: string
  death_cause?: string
  is_leader?: boolean
}

export interface StoryEvent {
  category: string
  text: string
}

/** Life-log categories that make a story's major events (the death itself is its own line). */
const MAJOR = new Set(['inheritance', 'friendship', 'loss', 'apprenticeship'])
const MAX_EVENTS = 3

function nameOf(p: StoryPerson): string {
  return personName(p)
}

/** The message for a sentence whose Russian verb takes the person's gender. */
function bySex<K extends string>(sex: string | undefined, neutral: K, male: K, female: K): K {
  return sex === 'female' ? female : sex === 'male' ? male : neutral
}

/** The story as a list of sentences, in the order they read. */
export function lifeStory(
  org: StoryPerson,
  others: ReadonlyArray<StoryPerson>,
  events: ReadonlyArray<StoryEvent> = [],
): string[] {
  const byId = new Map(others.map((o) => [o.id, o]))
  const lines: string[] = []
  const days = Math.floor(org.age / DAY_TICKS)

  const mother = org.parent_id ? byId.get(org.parent_id) : undefined
  const father = org.father_id ? byId.get(org.father_id) : undefined
  if (mother && father)
    lines.push(t('model.story.parents', { mother: nameOf(mother), father: nameOf(father) }))
  else if (mother) lines.push(t('model.story.mother', { name: nameOf(mother) }))
  else if (father) lines.push(t('model.story.father', { name: nameOf(father) }))

  if (org.specialty) lines.push(t('model.story.trade', { trade: simLabel('specialty', org.specialty) }))
  if (org.is_leader) lines.push(t('model.story.chief'))

  if (org.partner_id) {
    const partner = byId.get(org.partner_id)
    lines.push(
      partner
        ? t(
            bySex(partner.sex, 'model.story.partner', 'model.story.partnerMale', 'model.story.partnerFemale'),
            { name: nameOf(partner) },
          )
        : t('model.story.hasPartner'),
    )
  }

  const children = org.children_count ?? 0
  if (children > 0) lines.push(tn('model.story.children', children))

  for (const e of events.filter((e) => MAJOR.has(e.category)).slice(-MAX_EVENTS)) {
    const text = simText('life', e.text, { sex: sexOf(org) })
    lines.push(`${text.charAt(0).toUpperCase()}${text.slice(1)}.`)
  }

  if (org.alive) {
    lines.push(tn('model.story.living', days))
  } else if (org.death_cause) {
    const key: PluralKey = bySex(
      org.sex,
      'model.story.diedOf',
      'model.story.diedOfMale',
      'model.story.diedOfFemale',
    )
    lines.push(tn(key, days, { cause: simLabel('deathCause', org.death_cause) }))
  } else {
    lines.push(tn(bySex(org.sex, 'model.story.died', 'model.story.diedMale', 'model.story.diedFemale'), days))
  }
  return lines
}
