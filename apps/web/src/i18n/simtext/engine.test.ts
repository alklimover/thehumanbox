import { describe, expect, it } from 'vitest'
import { genderize, makeSimText, type SimTextTable } from './engine'

const table: SimTextTable = {
  'write poem': { thought: 'пишет стихи', event: 'написал[а] стихи' },
  'built a navigation cairn': 'сложил[а] путевой знак из камней',
  'led a dance': '[повёл|повела] танец',
  'rests by the fire': 'отдыхает у огня',
  'heard that {actor_name} {detail}': 'услышал[а], что {actor_name|someone} {detail@actor_name}',
  'noticed {actor_name} {detail}': 'заметил[а]: {actor_name|someone} {detail@actor_name}',
  '{name} is gone: "{text}"': 'Не стало {name}: «{text@name}»',
  'crafted {what} for the first time': 'впервые смастерил[а]: {what|good}',
  '🧬 {line}': '🧬 {line}',
  'the first great-grandchild of {tribe} is born': 'у племени {tribe} родился первый правнук',
}
const labels: Record<string, string> = { 'good:bow': 'лук' }
const st = makeSimText([table], (domain, id) => labels[`${domain}:${id}`] ?? null)

describe('genderize', () => {
  it('picks the form for the sex, or shows both', () => {
    expect(genderize('построил[а]', 'male')).toBe('построил')
    expect(genderize('построил[а]', 'female')).toBe('построила')
    expect(genderize('построил[а]', null)).toBe('построил(а)')
    expect(genderize('[пошёл|пошла] домой', 'female')).toBe('пошла домой')
    expect(genderize('[пошёл|пошла] домой', undefined)).toBe('пошёл/пошла домой')
  })
})

describe('simText engine', () => {
  it('keeps one English text apart by channel', () => {
    expect(st.text('thought', 'write poem')).toBe('пишет стихи')
    expect(st.text('life', 'write poem', { sex: 'female' })).toBe('написала стихи')
    expect(st.text('event', 'led a dance', { sex: 'male' })).toBe('повёл танец')
  })

  it('translates nested phrases with the sex of the person they are about', () => {
    const sexOf = (name: string) => (name === 'Giho' ? ('female' as const) : null)
    expect(st.text('life', 'heard that Giho built a navigation cairn', { sex: 'male', sexOf })).toBe(
      'услышал, что Giho сложила путевой знак из камней',
    )
  })

  it('names someone whose sex is unknown so that the verb agrees anyway', () => {
    const named = makeSimText(
      [table],
      () => null,
      (name) => `человек по имени ${name}`,
    )
    const sexOf = () => null
    expect(named.text('life', 'heard that Giho built a navigation cairn', { sex: 'male', sexOf })).toBe(
      'услышал, что человек по имени Giho сложил путевой знак из камней',
    )
    // A verb with one form for both needs nothing.
    expect(named.text('life', 'noticed Giho rests by the fire', { sex: 'female', sexOf })).toBe(
      'заметила: Giho отдыхает у огня',
    )
    // Only a `{name|someone}` subject is renamed: elsewhere the name may not be in the nominative.
    expect(named.text('headline', 'Giho is gone: "led a dance"', { sexOf })).toBe(
      'Не стало Giho: «повёл/повела танец»',
    )
    // Without the phrase both forms show, as before.
    expect(st.text('life', 'heard that Giho built a navigation cairn', { sex: 'male', sexOf })).toBe(
      'услышал, что Giho сложил(а) путевой знак из камней',
    )
  })

  it('names ids through the tables and leaves unknown text as it is', () => {
    expect(st.text('event', 'crafted bow for the first time', { sex: 'male' })).toBe('впервые смастерил: лук')
    expect(st.text('event', 'crafted zorb for the first time', { sex: 'male' })).toBe(
      'впервые смастерил: zorb',
    )
    expect(st.text('event', 'something nobody translated')).toBe('something nobody translated')
    expect(st.text('event', '')).toBe('')
  })

  it('finds a capitalised phrase inside a composed line', () => {
    expect(st.text('headline', '🧬 The first great-grandchild of Vuto is born')).toBe(
      '🧬 У племени Vuto родился первый правнук',
    )
  })
})

describe('composed lines', () => {
  it('finds a lowercased phrase without its period', () => {
    const t = makeSimText(
      [{ 'The world is real and I am part of it.': 'Мир настоящий, и я — его часть.' }],
      () => null,
    )
    expect(t.part('memory', 'the world is real and i am part of it')).toBe('мир настоящий, и я — его часть')
  })
})
