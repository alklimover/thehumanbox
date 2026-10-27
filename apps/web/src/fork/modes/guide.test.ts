import { afterEach, describe, expect, it } from 'vitest'
import { CATALOGS } from '../i18n/catalog'
import { setLocaleForTests } from '../i18n/locale'
import { guideSteps, PANEL_SELECTOR, resolveGuide } from './guide'

afterEach(() => setLocaleForTests('en'))

describe('the mode tips', () => {
  it('four steps a role, each pointing at a real part of the screen', () => {
    expect(guideSteps('observer').map((s) => s.selector)).toEqual([
      '[data-tour="world-canvas"]',
      PANEL_SELECTOR,
      '.time-control',
      '[data-tour="chronicles-btn"]',
    ])
    expect(guideSteps('god').map((s) => s.selector)).toEqual([
      '.prayer-chip',
      PANEL_SELECTOR,
      '.sandbox-bar',
      '[data-tour="more-btn"]',
    ])
  })

  it('every step is written in both languages', () => {
    for (const role of ['observer', 'god'] as const) {
      for (const step of guideSteps(role)) {
        for (const key of [step.title, step.text]) {
          expect(CATALOGS.en[key], key).toBeTruthy()
          expect(CATALOGS.ru[key], key).toBeTruthy()
        }
      }
    }
  })

  it('numbers the steps and stands a step whose target is missing in the middle', async () => {
    const steps = resolveGuide('god', (selector) => selector !== '.prayer-chip')
    expect(steps).toHaveLength(4)
    expect(steps[0]).toEqual({
      selector: '',
      title: '1 of 4 · Prayers',
      text: expect.stringContaining('A bubble over a tribe is a prayer'),
      on: undefined,
    })
    expect(steps[1]).toMatchObject({ selector: PANEL_SELECTOR, title: '2 of 4 · Who needs you', on: 'right' })
    await setLocaleForTests('ru')
    expect(resolveGuide('observer', () => true)[2]).toMatchObject({
      selector: '.time-control',
      title: '3 из 4 · Быстрее',
      text: 'Включите 10× и выше — годы пролетят за минуты. Пробел — пауза.',
    })
  })
})
