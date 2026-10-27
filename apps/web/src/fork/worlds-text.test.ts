import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from './i18n/locale'
import { worldFacts, worldTitle } from './worlds-text'

afterEach(() => setLocaleForTests('en'))

const slot = {
  hash: 'aaaa',
  name: null,
  seed: '12345',
  createdAt: Date.UTC(2026, 9, 21, 12),
  savedAt: Date.UTC(2026, 9, 22, 12),
  sizeBytes: 3 * 1_048_576 + 400_000,
  live: true,
}

describe('worlds list', () => {
  it('names a world by its name, or by the day it was made', async () => {
    await setLocaleForTests('ru')
    expect(worldTitle({ ...slot, name: 'Острова' })).toBe('Острова')
    expect(worldTitle(slot)).toMatch(/^мир от 21 окт/)
  })

  it('says when it was saved, its size and its seed', async () => {
    await setLocaleForTests('ru')
    expect(worldFacts(slot)).toMatch(/^сохранён 22 окт.* · 3,4 МБ · сид 12345$/)
    expect(worldFacts({ ...slot, seed: null })).not.toMatch(/сид/)
  })
})
