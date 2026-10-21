import { afterEach, describe, expect, it } from 'vitest'
import { tn } from '.'
import { setLocaleForTests } from './locale'

afterEach(() => setLocaleForTests('en'))

describe('settings plurals', () => {
  it('keeps the English capacity label as it was', () => {
    expect(tn('settings.sim.capacity', 1000)).toBe('World capacity: 1,000 people')
  })

  it('declines the Russian capacity label by count', () => {
    setLocaleForTests('ru')
    expect([121, 122, 500, 1000].map((n) => tn('settings.sim.capacity', n))).toEqual([
      'Вместимость мира: 121 человек',
      'Вместимость мира: 122 человека',
      'Вместимость мира: 500 человек',
      'Вместимость мира: 1 000 человек',
    ])
  })
})
