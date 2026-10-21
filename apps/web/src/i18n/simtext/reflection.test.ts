import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../locale'
import { simText } from '.'

afterEach(() => setLocaleForTests('en'))

describe('reflections', () => {
  it('takes apart mood, aspiration, frame and memory', () => {
    setLocaleForTests('ru')
    expect(
      simText(
        'thought',
        'feeling light, a provider at heart: I remember — the world is real and i am part of it',
        {
          sex: 'female',
        },
      ),
    ).toBe('на душе легко, в душе кормилец: я помню — мир настоящий, и я — его часть')
    expect(
      simText('thought', "still: I haven't forgotten — danger hurts. fire warms", { sex: 'female' }),
    ).toBe('тихо: я не забыла — опасность ранит. Огонь греет')
    expect(simText('thought', 'I am Lupif, a seeker at heart, here in the world')).toBe(
      'я — Лупиф, в душе искатель, здесь, в этом мире',
    )
  })

  it('stays English in the English interface', () => {
    const line = 'feeling light: I remember — the world is real and i am part of it'
    expect(simText('thought', line)).toBe(line)
  })
})
