import { afterEach, describe, expect, it } from 'vitest'
import { fmtNumber, ft, ftn } from '.'
import { CATALOGS } from './catalog'
import { setLocaleForTests } from './locale'

afterEach(() => setLocaleForTests('en'))

describe('the fork catalog', () => {
  it('is English in the test suite, so existing assertions keep working', () => {
    expect(ft('chronicle.tab')).toBe('Whole history')
  })

  it('follows upstream’s language and fills named placeholders', async () => {
    await setLocaleForTests('ru')
    expect(ft('chronicle.tab')).toBe('Вся история')
    expect(ft('load.speed', { speed: '4' })).toBe('без перегрузки до 4×')
  })

  it('reads English for any other language upstream offers', async () => {
    await setLocaleForTests('de' as never)
    expect(ft('chronicle.tab')).toBe('Whole history')
  })

  it('leaves an unknown placeholder visible instead of dropping it', () => {
    expect(ft('load.speed')).toBe('smooth up to {speed}x')
  })

  it('formats numbers the Russian way', async () => {
    await setLocaleForTests('ru')
    expect(fmtNumber(12345.5)).toBe('12\u00a0345,5')
  })

  it('every Russian message keeps the placeholders of its English source', () => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const [key, en] of Object.entries(CATALOGS.en)) {
      const ru = CATALOGS.ru[key]
      expect(ru, key).toBeDefined()
      const enForms = typeof en === 'string' ? [en] : Object.values(en)
      const ruForms = typeof ru === 'string' ? [ru] : Object.values(ru)
      for (const form of ruForms) expect(names(form), key).toEqual(names(enForms[0]))
    }
  })

  it('picks Russian plural forms by count', async () => {
    await setLocaleForTests('ru')
    expect([1, 3, 5, 21].map((n) => ftn('model.currency.shells', n))).toEqual([
      '1 ракушка',
      '3 ракушки',
      '5 ракушек',
      '21 ракушка',
    ])
  })
})
