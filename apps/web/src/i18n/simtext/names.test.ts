// The composed names (./names) against the Rust tables they are made from, so
// a new prefix, topic, art kind, faith name or era shows up here.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../locale'
import { artworkTitle, bookTitle, faithName } from './names'
import { hasSimText, simBookTitle, simFaithName, simText } from '.'

const SRC = join(__dirname, '../../../../../crates/sim-core/src')
const rust = (file: string) => readFileSync(join(SRC, file), 'utf8')
/** The string literals of a `pub const NAME: &[&str] = &[...]` table. */
const constTable = (file: string, name: string) => {
  const body = new RegExp(`${name}: &\\[&str\\] = &\\[([^\\]]*)\\]`).exec(rust(file))?.[1] ?? ''
  return [...body.matchAll(/"([^"]*)"/g)].map((m) => m[1])
}

afterEach(() => setLocaleForTests('en'))

describe('composed names', () => {
  it('make every book title in Russian', () => {
    const prefixes = constTable('sim/tech/language_tech.rs', 'BOOK_TITLE_PREFIX')
    const topics = constTable('sim/tech/language_tech.rs', 'BOOK_TITLE_TOPIC')
    expect(prefixes.length).toBeGreaterThan(5)
    const missing = prefixes.flatMap((p) => topics.map((t) => `${p} ${t}`)).filter((t) => !bookTitle(t))
    expect(missing).toEqual([])
    expect(bookTitle('The Book of the Sea')).toBe('Книга моря')
    expect(bookTitle('Of the First Word')).toBe('Слово о первом слове')
    expect(bookTitle('Letters from the Star')).toBe('Письма со звезды')
  })

  it('name every art kind and every faith', () => {
    const kinds = [...rust('sim/civ/society/culture.rs').matchAll(/ArtKind::\w+ => "([a-z_]+)"/g)].map(
      (m) => m[1],
    )
    expect(kinds.filter((k) => !artworkTitle(`Untitled ${k} no.3`))).toEqual([])
    const faiths = constTable('sim/civ/society/culture.rs', 'RELIGION_NAMES')
    expect(faiths.filter((f) => !faithName(f))).toEqual([])
    expect(faithName('Sun Path rel7')).toBe('Путь Солнца № 7')
    expect(faithName('Sun Path rel7-2')).toBe('Путь Солнца № 7-2')
  })

  it('know the sentence of every era', () => {
    const lines = [...rust('sim/civ/progress/eras/flavour.rs').matchAll(/Era::\w+ => "([^"]+)"/g)].map(
      (m) => m[1],
    )
    expect(lines.length).toBeGreaterThan(40)
    expect(lines.filter((l) => !hasSimText('event', l))).toEqual([])
  })

  it('reach the event feed and the headlines', () => {
    setLocaleForTests('ru')
    expect(simText('event', "wrote 'Notes on the River'", { sex: 'female' })).toBe(
      'написала книгу «Заметки о реке»',
    )
    expect(simText('event', "created fresco 'Untitled fresco no.40'", { sex: 'male' })).toBe(
      'создал фреску «Без названия № 40»',
    )
    expect(
      simText(
        'headline',
        '✝️ A schism splits Sun Path: the Moon Vow rel9 sect breaks away with 4 believers.',
      ),
    ).toBe('✝️ Раскол в вере «Путь Солнца»: отделяется секта «Лунный обет № 9», верующих — 4.')
    expect(
      simText(
        'event',
        'Vabik entered the stone era: People shape stone tools and learn to make fire at will.',
      ),
    ).toBe(
      'Вабик — новая эпоха: каменный век. Люди обтёсывают каменные орудия и учатся разводить огонь, когда захотят.',
    )
    expect(simBookTitle('Songs of the Forest')).toBe('Песни леса')
  })

  it('stay English in the English interface', () => {
    expect(simBookTitle('Songs of the Forest')).toBe('Songs of the Forest')
    expect(simFaithName('Sun Path rel7')).toBe('Sun Path rel7')
  })
})
