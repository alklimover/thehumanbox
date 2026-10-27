import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { goalTitle } from './goals'
import { setLocaleForTests } from './locale'

afterEach(() => setLocaleForTests('en'))

const GOALS_RS = readFileSync(
  new URL('../../../../../crates/sim-core/src/sim/goals.rs', import.meta.url),
  'utf8',
)

describe('goalTitle', () => {
  it('keeps the English title the simulation sends', () => {
    expect(goalTitle({ id: 'keep_three_tribes', title: 'Keep 3 tribes alive for 5 years' })).toBe(
      'Keep 3 tribes alive for 5 years',
    )
  })

  it('names the goals in Russian by id, with the numbers from the title', async () => {
    await setLocaleForTests('ru')
    expect(goalTitle({ id: 'keep_three_tribes', title: 'Keep 3 tribes alive for 5 years' })).toBe(
      'Сохранить 3 племени в живых в течение 5 лет',
    )
    expect(goalTitle({ id: 'keep_three_tribes', title: 'Keep 1 tribes alive for 1 years' })).toBe(
      'Сохранить 1 племя в живых в течение 1 года',
    )
    expect(goalTitle({ id: 'reach_iron_age', title: 'Reach the Iron Age' })).toBe(
      'Довести племя до железного века',
    )
    expect(goalTitle({ id: 'something_new', title: 'Something new' })).toBe('Something new')
  })

  it('knows every goal the simulation has', () => {
    const ids = [...GOALS_RS.matchAll(/^\s*id: "([a-z_]+)",$/gm)].map((m) => m[1]).sort()
    expect(ids).toEqual(['keep_three_tribes', 'reach_iron_age'])
    expect(GOALS_RS).toContain('format!("Keep {TRIBES_NEEDED} tribes alive for {SURVIVAL_YEARS} years")')
  })
})
