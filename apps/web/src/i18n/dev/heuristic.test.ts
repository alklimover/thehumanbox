import { describe, expect, it } from 'vitest'
import { englishWords, makeAllowlist, NAME_SHAPED_ENGLISH } from './heuristic'
import { i18nCheckWanted } from './flag'

describe('englishWords', () => {
  it('passes Russian text', () => {
    expect(englishWords('Племя на грани гибели — 3 человека')).toEqual([])
    expect(englishWords('Скорость: 10×, такт 1 234')).toEqual([])
  })

  it('flags lowercase English words', () => {
    expect(englishWords('tribe')).toEqual(['tribe'])
    expect(englishWords('heading to the trees')).toEqual(['heading', 'to', 'the', 'trees'])
    expect(englishWords('Племя Lupif: hunting')).toEqual(['hunting'])
  })

  it('flags capitalised English and raw ids', () => {
    expect(englishWords('Settings')).toEqual(['Settings'])
    expect(englishWords('The tribe')).toEqual(['The', 'tribe'])
    expect(englishWords('Sun Path')).toEqual(['Sun', 'Path'])
    expect(englishWords('stone_age')).toEqual(['stone', 'age'])
    expect(englishWords('kardashev 2')).toEqual(['kardashev'])
    expect(englishWords('STONE AGE')).toEqual(['STONE', 'AGE'])
    expect(englishWords('Save')).toEqual(['Save'])
  })

  it('does not flag names of people and tribes', () => {
    for (const name of ['Lupif', 'Kora', 'Tamen', 'Wazubor', 'Bendakit', 'Hilo', 'LUPIF']) {
      expect(englishWords(name), name).toEqual([])
    }
    expect(englishWords('Lupif и Kora поженились')).toEqual([])
    expect(englishWords('Lupif · Tamen')).toEqual([])
  })

  it('does not flag any name the simulation can make up', () => {
    // generate_name and generate_tribe_name (crates/sim-core/src/organism/organism/basics.rs), with a fixed LCG.
    const C = 'bdfghjklmnprstvwz'
    const V = 'aeiou'
    let state = 7
    const rand = () => (state = (Math.imul(state, 1103515245) + 12345) >>> 0) / 2 ** 32
    const pick = (s: string) => s[Math.floor(rand() * s.length)]
    for (let n = 0; n < 5000; n++) {
      const tribe = n % 2 === 0
      const syllables = 2 + Math.floor(rand() * 2)
      let name = ''
      for (let i = 0; i < syllables; i++) {
        name += pick(C) + pick(V)
        if (tribe && i < syllables - 1 && rand() < 0.3) name += pick(C)
        if (i === syllables - 1 && rand() < 0.6) name += pick(C)
      }
      name = name[0].toUpperCase() + name.slice(1)
      const flagged = englishWords(name)
      // A few names are English words too ("Note", "Home"); those are flagged on purpose.
      if (flagged.length > 0) expect(NAME_SHAPED_ENGLISH.has(name.toLowerCase()), name).toBe(true)
    }
  })

  it('does not flag the brand, keys, numbers and units', () => {
    expect(englishWords('The Human Box')).toEqual([])
    expect(englishWords('Добро пожаловать в The Human Box')).toEqual([])
    expect(englishWords('Shift + щелчок, Esc — отмена, Ctrl/Cmd + K')).toEqual([])
    expect(englishWords('F1 F12 Space Tab Alt')).toEqual([])
    expect(englishWords('10x 60fps 16 ms 2px 3,4 MB')).toEqual([])
    expect(englishWords('такт t1234, a3f9')).toEqual([])
    expect(englishWords('q w e r')).toEqual([])
  })

  it('skips addresses, file names and technical names', () => {
    expect(englishWords('github.com/alklimover/thehumanbox')).toEqual([])
    expect(englishWords('файл мира .world.save, версия v0.6.22')).toEqual([])
    expect(englishWords('mail@example.com')).toEqual([])
    expect(englishWords('macOS, WebGL, GitHub')).toEqual([])
  })

  it('honours the allowlist', () => {
    const allow = makeAllowlist(['Sun Path'], ['tribe'])
    expect(englishWords('Sun Path', allow)).toEqual([])
    expect(englishWords('tribe', allow)).toEqual([])
    expect(englishWords('Tribe', allow)).toEqual([])
    expect(englishWords('tribes', allow)).toEqual(['tribes'])
    // Without the defaults the brand is English again ("Human" has the shape of a name).
    expect(englishWords('The Human Box', allow)).toEqual(['The', 'Box'])
  })

  it('reports each word once', () => {
    expect(englishWords('the tribe and the tribe')).toEqual(['the', 'tribe', 'and'])
  })
})

describe('i18nCheckWanted', () => {
  const base = { dev: false, locale: 'ru' as const, search: '', stored: null }

  it('is on in the dev server with the Russian interface only', () => {
    expect(i18nCheckWanted({ ...base, dev: true })).toBe(true)
    expect(i18nCheckWanted({ ...base, dev: true, locale: 'en' })).toBe(false)
    expect(i18nCheckWanted(base)).toBe(false)
  })

  it('can be switched on in any build and off in the dev server', () => {
    expect(i18nCheckWanted({ ...base, search: '?i18n-check=1' })).toBe(true)
    expect(i18nCheckWanted({ ...base, locale: 'en', stored: '1' })).toBe(true)
    expect(i18nCheckWanted({ ...base, dev: true, search: '?seed=4&i18n-check=0' })).toBe(false)
    expect(i18nCheckWanted({ ...base, stored: '1', search: '?i18n-check=0' })).toBe(false)
  })
})
