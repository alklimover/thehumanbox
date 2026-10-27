// The fork's hooks in upstream's helpers (docs/fork/SYNC.ru.md, «Где форк правит файлы автора»). A sync that
// takes upstream's side of one of these files drops its hook silently; this test is what notices.
import { afterEach, describe, expect, it } from 'vitest'
import { ageInYears, YEAR_TICKS } from '../../game/model/calendar'
import { changeReason } from '../../game/model/pause-on'
import { eraWord } from '../../shared/era-words'
import { governmentWord } from '../../shared/government-words'
import { personName } from '../../shared/personName'
import { knownTribeName } from '../../state/worldStore'
import { shortcutKeys } from '../../ui/toolbar/shortcut-text'
import { buildingKindWord, discoveryWord, goodWord } from '../../ui/sim-words'
import { setLocaleForTests } from './locale'

afterEach(() => setLocaleForTests('en'))

describe('the fork’s hooks in upstream’s helpers', () => {
  it('leave English as upstream shows it', () => {
    expect(personName({ name: 'Lupif' })).toBe('Lupif')
    expect(knownTribeName({ a: 'Zerogu' }, 'a')).toBe('Zerogu')
    expect(eraWord('kardashev-2')).toBe('kardashev 2')
    expect(ageInYears(30 * YEAR_TICKS)).toBe('30 yrs')
    expect(shortcutKeys('space')).toBe('space')
  })

  it('show generated names in Cyrillic and a name the player gave as typed', async () => {
    await setLocaleForTests('ru')
    expect(personName({ name: 'Lupif' })).toBe('Лупиф')
    expect(personName({ name: 'Lupif', custom_name: 'Bob' })).toBe('Bob')
    expect(knownTribeName({ a: 'Zerogu' }, 'a')).toBe('Зерогу')
    expect(knownTribeName({}, 'missing')).toBeUndefined()
    expect(changeReason({ trigger: 'extinct', names: ['Zerogu'] })).toContain('Зерогу')
  })

  it('name in Russian the ids upstream has no word for, from the fork’s tables', async () => {
    await setLocaleForTests('ru')
    expect(eraWord('stone')).toBe('каменный век')
    expect(eraWord('kardashev-2')).toBe('цивилизация II типа')
    expect(governmentWord('tribal')).not.toMatch(/[a-z]/)
    expect(buildingKindWord('hut')).toBe('хижина')
    expect(discoveryWord('fire')).not.toMatch(/[a-z]/)
    expect(goodWord('play cello')).not.toMatch(/[a-z]/)
  })

  it('decline years and name the Space key in Russian', async () => {
    await setLocaleForTests('ru')
    expect(ageInYears(30 * YEAR_TICKS)).toBe('30 лет')
    expect(ageInYears(21 * YEAR_TICKS)).toBe('21 год')
    expect(ageInYears(1.4 * YEAR_TICKS)).toBe('1,4 года')
    expect(shortcutKeys('space')).toBe('Пробел')
  })
})
