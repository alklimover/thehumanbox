import { describe, expect, it } from 'vitest'
import { mergeLocale } from '../../../../../scripts/fork/merge-locale-json.mjs'

// The rule an upstream sync applies to a conflicted locales/ru file (scripts/fork/upstream-sync.sh).
describe('merging a Russian locale file by key', () => {
  const base = {
    a: 'старое А',
    b: { c: 'старое В', d: { one: '{count} штука', other: '{count} штуки' } },
    gone: 'Г',
  }
  const ours = {
    a: 'А форка',
    b: { c: 'старое В', d: { one: '{count} вещь', other: '{count} вещи' } },
    gone: 'Г',
  }
  const theirs = { a: 'новое А', b: { c: 'новое В', d: base.b.d }, added: 'новый ключ' }

  it('keeps upstream’s keys, takes the side that changed a text, and the fork’s when both did', () => {
    const { tree, kept } = mergeLocale({ base, ours, theirs, enBase: {}, enTheirs: {} })
    expect(tree).toEqual({
      a: 'А форка',
      b: { c: 'новое В', d: { one: '{count} вещь', other: '{count} вещи' } },
      added: 'новый ключ',
    })
    expect(kept).toEqual([['a', 'both']])
  })

  it('flags a kept fork text whose English upstream changed', () => {
    const { kept } = mergeLocale({ base, ours, theirs, enBase: { a: 'A' }, enTheirs: { a: 'A, reworded' } })
    expect(kept).toEqual([['a', 'en-changed']])
  })
})
