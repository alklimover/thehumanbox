import type { SimTable } from './types'

// What a person sets their heart on: who they want to become
// (`tick_aspirations` in crates/sim-core/src/sim/civ/civ_tick/people.rs) or,
// rarely, a hope in their own words (`tick_hopeful_aspiration` in
// crates/sim-core/src/sim/civ/moments/mood.rs). The tooltip lines for the ten
// roles are in catalog/people.ts (`people.aspirationTip.<id>`).
export const aspiration: SimTable = {
  seeker: { ru: 'искатель' },
  wanderer: { ru: 'странник' },
  warrior: { ru: 'воин' },
  connector: { ru: 'сердце семьи' },
  builder: { ru: 'строитель' },
  devout: { ru: 'праведник' },
  sage: { ru: 'мудрец' },
  provider: { ru: 'кормилец' },
  artist: { ru: 'творец' },
  healer: { ru: 'целитель' },

  'to build a great hall': { ru: 'возвести большой чертог' },
  'to remember every name': { ru: 'помнить каждое имя' },
  'to never be hungry again': { ru: 'больше никогда не голодать' },
  'to keep my kin safe': { ru: 'уберечь родных' },
  'to see the far shore': { ru: 'увидеть дальний берег' },
  'to write our story down': { ru: 'записать нашу историю' },
  'to learn the night sky': { ru: 'постичь ночное небо' },
  'to be remembered well': { ru: 'оставить добрую память' },
}
