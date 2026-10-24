import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../../i18n/locale'
import {
  CATEGORIES,
  DEFAULT_CATEGORIES,
  countNewer,
  entryActor,
  entrySex,
  entryText,
  groupByYear,
  isDiedOut,
  liveTribe,
  loadCategories,
  mergeNewer,
  pageQuery,
  seasonOf,
  tribeOptions,
  withNames,
  type ChronicleEntry,
  type ChronicleTribe,
} from './model'

const YEAR = 12000

function entry(id: number, tick: number, over: Partial<ChronicleEntry> = {}): ChronicleEntry {
  return {
    id,
    tick,
    src: 'event',
    kind: 'era_advance',
    cat: 'eras',
    actor: 'Kefe',
    text: 'Kefe entered the iron era: Iron replaces bronze in the fields and at war.',
    era: 'iron',
    tribes: [{ id: 'aaaa1111', name: 'Kefe' }],
    ...over,
  }
}

function tribe(id: string, name: string, diedOut: number | null = null): ChronicleTribe {
  return { id, name, first_tick: 0, last_tick: 0, died_out_tick: diedOut, peak: 5, entries: 1 }
}

afterEach(() => setLocaleForTests('en'))

describe('the chronicle by years', () => {
  it('puts entries under their year with the server tally and era', () => {
    const entries = [entry(5, 4 * YEAR + 10), entry(4, 4 * YEAR + 5), entry(3, 3 * YEAR + 9000), entry(1, 20)]
    const groups = groupByYear(entries, [
      { year: 4, count: 42, era: 'iron' },
      { year: 3, count: 37, era: 'bronze' },
    ])
    expect(groups.map((g) => [g.year, g.count, g.era, g.entries.map((e) => e.id)])).toEqual([
      [4, 42, 'iron', [5, 4]],
      [3, 37, 'bronze', [3]],
      [0, 1, 'iron', [1]],
    ])
  })

  it('never counts fewer than what is loaded', () => {
    const groups = groupByYear([entry(2, 10), entry(1, 5)], [{ year: 0, count: 1, era: 'stone' }])
    expect(groups[0].count).toBe(2)
  })

  it('starts the year in summer, as the game calendar does', () => {
    expect(seasonOf(0)).toBe('Summer')
    expect(seasonOf(3000)).toBe('Autumn')
    expect(seasonOf(6000)).toBe('Winter')
    expect(seasonOf(9000)).toBe('Spring')
    setLocaleForTests('ru')
    expect(seasonOf(YEAR + 6500)).toBe('зима')
  })
})

describe('the top refresh', () => {
  it('puts new entries on top once, newest first', () => {
    const shown = [entry(3, 30), entry(2, 20)]
    const merged = mergeNewer(shown, [entry(5, 50), entry(3, 30), entry(4, 40)])
    expect(merged.map((e) => e.id)).toEqual([5, 4, 3, 2])
    expect(mergeNewer(shown, [])).toBe(shown)
    expect(mergeNewer(shown, [entry(3, 30)])).toBe(shown)
  })

  it('adds them to the years they fall in', () => {
    const years = countNewer([{ year: 0, count: 2, era: 'stone' }], [entry(9, 100), entry(10, YEAR + 1)])
    expect(years).toEqual([
      { year: 1, count: 1, era: 'iron' },
      { year: 0, count: 3, era: 'iron' },
    ])
  })
})

describe('a line as shown', () => {
  it('writes the ids of battles and treaties as the tribes named then', () => {
    const tribes = [
      { id: 'daede9ab', name: 'Zovu' },
      { id: '95c7402d', name: 'Kefe' },
    ]
    expect(withNames('daede9ab attacks 95c7402d (raid)', tribes)).toBe('Zovu attacks Kefe (raid)')
    expect(withNames('no ids here', tribes)).toBe('no ids here')
    expect(withNames('deadbeef stays', tribes)).toBe('deadbeef stays')
  })

  it('shows the actor only where the line does not name it', () => {
    expect(entryActor(entry(1, 1))).toBe('')
    expect(entryActor(entry(1, 1, { kind: 'prayer', actor: 'Zumiwi', text: 'pray for food' }))).toBe('Zumiwi')
    expect(entryActor(entry(1, 1, { kind: 'drought', actor: 'world', text: 'drought begins' }))).toBe('')
    expect(entryActor(entry(1, 1, { src: 'headline', actor: 'world', text: '🤝 A and B forged' }))).toBe('')
    expect(
      entryActor(
        entry(1, 1, {
          kind: 'raid_started',
          actor: 'daede9ab',
          text: 'raid against 95c7402d at (1,2)',
          tribes: [
            { id: 'daede9ab', name: 'Zovu' },
            { id: '95c7402d', name: 'Kefe' },
          ],
        }),
      ),
    ).toBe('Zovu')
  })

  it('is translated at display, with names in Cyrillic', () => {
    setLocaleForTests('ru')
    expect(entryText(entry(1, 1))).toMatch(/^Кефе — новая эпоха: железный век\./)
    expect(entryText(entry(1, 1, { src: 'era', kind: 'era', text: 'bronze', tribes: [] }))).toBe(
      'В мире наступает новая эпоха: бронзовый век.',
    )
  })

  it('tells a small tribe dying out, with how big it once was', () => {
    const died = entry(1, 1, { src: 'server', kind: 'died_out', cat: 'tribes', actor: 'Meleru', text: '' })
    setLocaleForTests('ru')
    expect(entryText({ ...died, tribes: [{ id: 'x', name: 'Meleru' }] }, undefined, 5)).toBe(
      'Племя Мелеру вымерло, а когда-то в нём было 5 человек.',
    )
    expect(entryText({ ...died, tribes: [{ id: 'x', name: 'Meleru' }] }, undefined, 3)).toBe(
      'Племя Мелеру вымерло, а когда-то в нём было 3 человека.',
    )
    expect(entryText({ ...died, tribes: [{ id: 'x', name: 'Meleru' }] }, undefined, 0)).toBe(
      'Племя Мелеру вымерло.',
    )
    setLocaleForTests('en')
    expect(entryText({ ...died, tribes: [{ id: 'x', name: 'Meleru' }] }, undefined, 1)).toBe(
      'The Meleru died out; at their height they were 1.',
    )
  })
})

describe('the filter', () => {
  it('asks for every heading by sending none', () => {
    expect(pageQuery({ categories: CATEGORIES, lineage: null })).toBe('')
    expect(pageQuery({ categories: ['eras', 'war'], lineage: 'aaaa1111' }, { limit: 200 })).toBe(
      'kinds=eras%2Cwar&lineage=aaaa1111&limit=200',
    )
    expect(pageQuery({ categories: CATEGORIES, lineage: null }, { before: { tick: 5, id: 9 } })).toBe(
      'before_tick=5&before_id=9',
    )
    expect(pageQuery({ categories: CATEGORIES, lineage: null }, { afterId: 12 })).toBe('after_id=12')
  })

  it('keeps people, nature and prayers off until asked for, and remembers the choice', () => {
    expect(DEFAULT_CATEGORIES).not.toContain('people')
    expect(DEFAULT_CATEGORIES).not.toContain('nature')
    expect(DEFAULT_CATEGORIES).not.toContain('prayers')
    expect(DEFAULT_CATEGORIES).toContain('eras')
    expect(loadCategories(null)).toEqual(DEFAULT_CATEGORIES)
    const saved = { getItem: () => JSON.stringify(['people', 'eras', 'bogus']) }
    expect(loadCategories(saved)).toEqual(['eras', 'people'])
    expect(loadCategories({ getItem: () => '{oops' })).toEqual(DEFAULT_CATEGORIES)
  })

  it('lists the tribes by name, the ones with nobody left last and marked', () => {
    setLocaleForTests('ru')
    const tribes = [tribe('b', 'Zovu', 900), tribe('a', 'Kefe'), tribe('c', 'Daki')]
    expect(tribeOptions(tribes, new Set(['a', 'c']))).toEqual([
      { id: 'c', label: 'Даки', diedOut: false },
      { id: 'a', label: 'Кефе', diedOut: false },
      { id: 'b', label: 'Зову (вымерли)', diedOut: true },
    ])
  })

  it('sends the ▸ to the first tribe a line names that still has people', () => {
    const tribes = [tribe('b', 'Zovu', 900), tribe('a', 'Kefe')]
    const both = entry(1, 1, {
      tribes: [
        { id: 'b', name: 'Zovu' },
        { id: 'a', name: 'Kefe' },
      ],
    })
    expect(liveTribe(both, tribes, new Set(['a']))?.id).toBe('a')
    expect(liveTribe({ ...both, tribes: [{ id: 'b', name: 'Zovu' }] }, tribes, new Set(['a']))).toBeNull()
  })

  it('reads the sex of the person a line is about', () => {
    const sexOf = (name: string) => (name === 'Ramona' ? 'female' : name === 'Daki' ? 'male' : null)
    const crown = entry(1, 1, {
      src: 'headline',
      kind: 'headline',
      actor: '',
      text: '👑 Ramona of the Mufos seized power in a coup.',
    })
    expect(entrySex(crown, sexOf)).toBe('female')
    const elder = { ...crown, text: 'Daki became an elder, carrying: "x"' }
    expect(entrySex(elder, sexOf)).toBe('male')
    expect(entrySex(entry(1, 1), sexOf)).toBe('male')
    expect(entrySex(entry(1, 1, { kind: 'theft', actor: 'Ramona', text: 'stole 3' }), sexOf)).toBe('female')
    // The simulation's own record wins: the person may be long gone from the world on screen.
    expect(entrySex({ ...crown, sex: 'male' }, () => null)).toBe('male')
  })

  it('makes a dead person’s last memory agree with them', () => {
    setLocaleForTests('ru')
    const gone = entry(1, 1, {
      src: 'headline',
      kind: 'headline',
      cat: 'people',
      actor: '',
      text: 'Guto is gone. What they carried: "fell in love with Kepor"',
      sex: 'female',
    })
    expect(entryText(gone)).toBe('Не стало Гуто. В памяти осталось: «влюбилась в Кепор»')
    expect(entryText({ ...gone, sex: undefined })).toContain('влюбился/ась')
  })

  it('takes a tribe the world shows alive as alive, whatever the record says', () => {
    const tribes = [tribe('b', 'Zovu', 900)]
    expect(isDiedOut('b', tribes, new Set(['b']))).toBe(false)
    expect(isDiedOut('b', tribes, new Set())).toBe(true)
    expect(isDiedOut('b', tribes, null)).toBe(true)
    expect(isDiedOut('x', tribes, new Set())).toBe(false)
  })
})
