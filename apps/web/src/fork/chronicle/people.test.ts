import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../i18n/locale'
import type { ChronicleEntry } from './model'
import { causeOfDeath, collapsePeople, groupText, memberText, personLine, personText } from './people'

const SEASON = 3000

let next = 1000
function headline(tick: number, text: string, over: Partial<ChronicleEntry> = {}): ChronicleEntry {
  next -= 1
  return {
    id: next,
    tick,
    src: 'headline',
    kind: 'headline',
    cat: 'people',
    actor: '',
    text,
    era: 'iron',
    tribes: [{ id: 'aaaa1111', name: 'Kefe' }],
    ...over,
  }
}

const gone = (tick: number, name: string, memory: string, sex: 'male' | 'female' = 'male') =>
  headline(tick, `${name} is gone. What they carried: "${memory}"`, { sex })
const elder = (tick: number, name: string, memory: string) =>
  headline(tick, `${name} became an elder, carrying: "${memory}"`, { sex: 'female' })
const other = (tick: number) => headline(tick, 'Gedo and Kirok pledged themselves to each other')
const nobody = () => null

afterEach(() => setLocaleForTests('en'))

describe('people lines', () => {
  it('reads who, what they carried and the cause of death', () => {
    expect(personLine(gone(5, 'Goku', 'died of drowning at age 351'))).toEqual({
      kind: 'gone',
      name: 'Goku',
      memory: 'died of drowning at age 351',
      cause: 'drowning',
    })
    expect(
      personLine(headline(5, 'Wavu is gone. What they carried: "weave tapestry" (held in mind 11 times)')),
    ).toEqual({ kind: 'gone', name: 'Wavu', memory: 'weave tapestry', cause: null })
    expect(personLine(headline(5, 'Duli became an elder among the people'))).toEqual({
      kind: 'elder',
      name: 'Duli',
      memory: null,
      cause: null,
    })
    expect(personLine(other(5))).toBeNull()
    expect(personLine({ ...gone(5, 'Goku', 'x'), src: 'event' })).toBeNull()
    expect(causeOfDeath('died of old age at 72')).toBe('old age')
    expect(causeOfDeath('fell in battle at age 40')).toBe('war')
    expect(causeOfDeath('I lost my friend Duli')).toBeNull()
  })
})

describe('a season of people in one row', () => {
  it('folds the deaths and the elders of each season, where the latest of them stands', () => {
    const entries = [
      gone(2 * SEASON + 90, 'Aru', 'died of drowning at age 9'),
      other(2 * SEASON + 80),
      elder(2 * SEASON + 70, 'Biko', 'we held a festival — drums until dawn'),
      gone(2 * SEASON + 60, 'Cela', 'fell in love with Duli'),
      elder(2 * SEASON + 50, 'Dan', 'weave tapestry'),
      // The season before: one death alone stays a row of its own.
      gone(SEASON + 10, 'Eno', 'died of old age at 80'),
    ]
    const items = collapsePeople(entries)
    expect(
      items.map((i) =>
        i.type === 'entry' ? i.entry.text.slice(0, 4) : `${i.kind}:${i.members.map((m) => m.line.name)}`,
      ),
    ).toEqual(['gone:Aru,Cela', 'Gedo', 'elder:Biko,Dan', 'Eno '])
  })

  it('adds the next page to the season it cut instead of starting another row', () => {
    const first = [gone(SEASON + 900, 'Aru', 'x'), gone(SEASON + 800, 'Biko', 'y')]
    const second = [gone(SEASON + 700, 'Cela', 'z'), gone(SEASON - 1, 'Dan', 'w')]
    const before = collapsePeople(first)
    const after = collapsePeople([...first, ...second])
    expect(before.length).toBe(1)
    expect(after.map((i) => (i.type === 'group' ? [i.key, i.members.length] : i.entry.id))).toEqual([
      [(before[0] as { key: string }).key, 3],
      second[1].id,
    ])
  })
})

describe('the people rows in Russian', () => {
  it('says a death that is only its cause with the person’s sex', async () => {
    await setLocaleForTests('ru')
    const he = gone(5, 'Goku', 'died of drowning at age 351')
    const she = gone(5, 'Lida', 'died of drowning at age 40', 'female')
    const old = gone(5, 'Eno', 'died of old age at 80')
    const unknown = { ...gone(5, 'Zoru', 'died of murder at age 30'), sex: undefined }
    const text = (e: ChronicleEntry) => personText({ entry: e, line: personLine(e)! }, nobody)
    expect(text(he)).toBe('Не стало Гоку (утонул)')
    expect(text(she)).toBe('Не стало Лида (утонула)')
    expect(text(old)).toBe('Не стало Эно (от старости)')
    expect(text(unknown)).toBe('Не стало Зору (убит(а))')
    // Any other memory keeps the line as it was.
    const love = gone(5, 'Cela', 'fell in love with Duli', 'female')
    expect(text(love)).toBe('Не стало Кела. В памяти осталось: «влюбилась в Дули»')
  })

  it('counts the season’s dead in the right plural, by cause when every death has one', async () => {
    await setLocaleForTests('ru')
    const members = (memories: string[]) =>
      memories.map((m, i) => {
        const entry = gone(5, `Na${'bcdefghijklmnopqrstuvwxyz'[i]}`, m)
        return { entry, line: personLine(entry)! }
      })
    const drowned = 'died of drowning at age 9'
    const old = 'died of old age at 80'
    expect(groupText('gone', members([drowned, old, drowned]))).toBe(
      'Не стало 3 человек: утопление — 2, старость — 1',
    )
    expect(
      groupText('gone', members([drowned, 'weave tapestry', 'fell in love with Duli', drowned, old])),
    ).toBe('Не стало 5 человек: Наб, Нак, Над и ещё 2 · утопление — 2, старость — 1')
    expect(groupText('gone', members(Array(21).fill('weave tapestry')))).toBe(
      'Не стало 21 человека: Наб, Нак, Над и ещё 18',
    )
    expect(groupText('elder', members(['a', 'b']))).toBe('Старейшинами стали 2 человека: Наб, Нак')
    expect(groupText('elder', members(Array(5).fill('a')))).toBe(
      'Старейшинами стали 5 человек: Наб, Нак, Над и ещё 2',
    )
    expect(groupText('elder', members(Array(21).fill('a')))).toBe(
      'Старейшинами стал 21 человек: Наб, Нак, Над и ещё 18',
    )
  })

  it('names each one when the row opens', async () => {
    await setLocaleForTests('ru')
    const member = (e: ChronicleEntry) => memberText({ entry: e, line: personLine(e)! }, nobody)
    expect(member(gone(5, 'Lida', 'died of drowning at age 40', 'female'))).toBe('Лида (утонула)')
    expect(member(elder(5, 'Biko', 'we held a festival — drums until dawn'))).toBe(
      'Бико: «у нас был праздник — барабаны до рассвета»',
    )
    expect(member(headline(5, 'Duli became an elder among the people'))).toBe('Дули')
  })

  it('tells a deed of someone gone from the world without guessing their sex', async () => {
    await setLocaleForTests('ru')
    const heard = gone(5, 'Zoliwo', 'heard that Jujo built a navigation cairn', 'female')
    const line = personLine(heard)!
    expect(memberText({ entry: heard, line }, nobody)).toBe(
      'Золиво: «услышала, что человек по имени Джуджо сложил путевой знак из камней»',
    )
    // Known from the world on screen, or from a line of their own.
    const sexOf = (name: string) => (name === 'Jujo' ? ('female' as const) : null)
    expect(memberText({ entry: heard, line }, sexOf)).toBe(
      'Золиво: «услышала, что Джуджо сложила путевой знак из камней»',
    )
  })
})

describe('the people rows in English', () => {
  it('keeps the words natural', () => {
    const e = gone(5, 'Goku', 'died of drowning at age 351')
    expect(personText({ entry: e, line: personLine(e)! }, nobody)).toBe('Goku is gone (drowned)')
    const members = [e, gone(5, 'Eno', 'died of old age at 80')].map((entry) => ({
      entry,
      line: personLine(entry)!,
    }))
    expect(groupText('gone', members)).toBe('2 people are gone: drowning — 1, old age — 1')
    expect(groupText('elder', members)).toBe('2 people became elders: Goku, Eno')
  })
})
