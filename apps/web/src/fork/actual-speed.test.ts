import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from './i18n/locale'
import {
  formatActualSpeed,
  parsePowerState,
  parseRuntimeSpeed,
  powerNote,
  speedLags,
  withPowerNote,
} from './actual-speed'

afterEach(() => setLocaleForTests('en'))

describe('the achieved speed', () => {
  it('is read from GET /runtime only with both speeds', () => {
    expect(
      parseRuntimeSpeed({ ok: true, paused: false, speed: 50, tick_ms: 16, actual_speed: 2.45 }),
    ).toEqual({
      speed: 50,
      actual: 2.45,
    })
    // An older sim, a paused one, or one still measuring.
    expect(parseRuntimeSpeed({ ok: true, speed: 50 })).toBeNull()
    expect(parseRuntimeSpeed({ ok: true, speed: 50, actual_speed: null })).toBeNull()
    expect(parseRuntimeSpeed({ ok: true, actual_speed: 2 })).toBeNull()
    expect(parseRuntimeSpeed(null)).toBeNull()
  })

  it('counts as lagging only well short of a speed past 1×', () => {
    expect(speedLags(40, 6)).toBe(true)
    expect(speedLags(40, 35)).toBe(false)
    expect(speedLags(2, 1.2)).toBe(true)
    expect(speedLags(1, 0.5)).toBe(false)
    expect(speedLags(40, null)).toBe(false)
  })

  it('is written as precisely as it is worth, with the locale decimal mark', async () => {
    expect(formatActualSpeed(17.4)).toBe('17×')
    expect(formatActualSpeed(2.45)).toBe('2.5×')
    expect(formatActualSpeed(0.68)).toBe('0.68×')
    await setLocaleForTests('ru')
    expect(formatActualSpeed(2.45)).toBe('2,5×')
    expect(formatActualSpeed(6)).toBe('6×')
  })
})

describe('the power note', () => {
  it('reads the state from the desktop shell defensively', () => {
    expect(parsePowerState({ managed: true, mode: 'efficiency', reason: 'battery' })).toEqual({
      managed: true,
      mode: 'efficiency',
      reason: 'battery',
    })
    expect(parsePowerState({ managed: true, mode: 'efficiency', reason: 'solar' })?.reason).toBeNull()
    // A hidden window no longer moves the world off the performance cores.
    expect(parsePowerState({ managed: true, mode: 'efficiency', reason: 'hidden' })?.reason).toBeNull()
    expect(parsePowerState({ managed: true, mode: 'turbo', reason: null })).toBeNull()
    expect(parsePowerState('junk')).toBeNull()
  })

  it('says why the world is on the efficiency cores, and nothing otherwise', async () => {
    await setLocaleForTests('ru')
    expect(powerNote({ managed: true, mode: 'efficiency', reason: 'battery' })).toBe(
      'Mac работает от батареи: мир считается на энергоэффективных ядрах, чтобы Mac не грелся и не шумел.',
    )
    expect(powerNote({ managed: true, mode: 'efficiency', reason: 'thermal' })).toContain('перегрелся')
    expect(powerNote({ managed: true, mode: 'performance', reason: null })).toBeUndefined()
    expect(powerNote({ managed: false, mode: 'performance', reason: null })).toBeUndefined()
    expect(powerNote(null)).toBeUndefined()
  })

  it('follows the lag note in the tooltip', () => {
    const eco = { managed: true, mode: 'efficiency', reason: 'low-power' } as const
    expect(withPowerNote('Slow.', eco)).toBe(
      'Slow. Low Power Mode is on, so the world runs on the efficiency cores.',
    )
    expect(withPowerNote(undefined, eco)).toBe(
      'Low Power Mode is on, so the world runs on the efficiency cores.',
    )
    expect(withPowerNote('Slow.', null)).toBe('Slow.')
    expect(withPowerNote(undefined, null)).toBeUndefined()
  })
})
