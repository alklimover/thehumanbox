import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from './locale'
import { displayName, nameMatches, nameRu, namesInText } from './names'
import { simActor, simText } from './simtext'

afterEach(() => setLocaleForTests('en'))

describe('names in Cyrillic', () => {
  it('spells generated names letter by letter', () => {
    expect(nameRu('Lupif')).toBe('Лупиф')
    expect(nameRu('Giho')).toBe('Гихо')
    expect(nameRu('Wusu Gafo')).toBe('Вусу Гафо')
    expect(nameRu('Jazek')).toBe('Джазек')
    expect(nameRu('Lelavadj')).toBe('Лелавадж')
  })

  it('reads e and i after a vowel as Russian does', () => {
    expect(nameRu('Elo')).toBe('Эло')
    expect(nameRu('Baet')).toBe('Баэт')
    expect(nameRu('Lena')).toBe('Лена')
    expect(nameRu('Kai')).toBe('Кай')
    expect(nameRu('Daiko')).toBe('Дайко')
    expect(nameRu('Maio')).toBe('Маио')
  })

  it('leaves names alone in English and Cyrillic names as they are', () => {
    expect(displayName('Lupif')).toBe('Lupif')
    setLocaleForTests('ru')
    expect(displayName('Lupif')).toBe('Лупиф')
    expect(displayName('Мира')).toBe('Мира')
    expect(displayName(undefined)).toBe('')
  })

  it('changes only capitalised words inside a text (ids and codes stay)', () => {
    expect(namesInText('→ Bimetu: подарок (e1c1 ↔ be77)')).toBe('→ Бимету: подарок (e1c1 ↔ be77)')
  })

  it('finds a person by either alphabet', () => {
    expect(nameMatches('Lupif', 'луп')).toBe(true)
    expect(nameMatches('Lupif', 'lup')).toBe(true)
    expect(nameMatches('Lupif', 'гих')).toBe(false)
  })

  it('shows names in Cyrillic in translated simulation text only', () => {
    setLocaleForTests('ru')
    expect(simText('life', 'heard that Giho built a navigation cairn', { sex: 'female' })).toMatch(
      /^услышала, что Гихо /,
    )
    expect(simText('event', 'some line no table knows, by Giho')).toBe('some line no table knows, by Giho')
    expect(simActor('Giho')).toBe('Гихо')
    expect(simText('thought', '"do" (12/23)')).toBe('«до» (поняли 12 из 23)')
    expect(simText('headline', 'the Lelavadj held a Sun Feast — drums, dancing, every belly full')).toBe(
      'Лелавадж: праздник Солнца — барабаны, пляски, все сыты',
    )
    // Partly translated: the English left over keeps the names beside it in Latin too.
    expect(simText('headline', 'Lelavadj: a Sun Feast — something new')).not.toMatch(/Сун/)
    expect(simActor('world')).not.toMatch(/[A-Za-z]/)
  })
})
