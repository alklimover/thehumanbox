// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../i18n/locale'
import type { DesktopBridge } from '../shared/desktop'
import { PopulationLoadSlider } from './PopulationLoad'
import { type DeviceProfile, REFERENCE_BENCH_MS } from './population-load'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  setLocaleForTests('ru')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  setLocaleForTests('en')
})

const m1: DeviceProfile = {
  chip: 'Apple M1',
  totalMemBytes: 8 * 1024 ** 3,
  perfCores: 4,
  efficiencyCores: 4,
  benchMsPerTick: REFERENCE_BENCH_MS * 1.8,
}

function desktopWith(profile: DeviceProfile, calls: boolean[] = []): DesktopBridge {
  return {
    forkDevice: {
      profile: (remeasure?: boolean) => {
        calls.push(remeasure === true)
        return Promise.resolve(profile)
      },
    },
  } as unknown as DesktopBridge
}

async function renderSlider(desktop: DesktopBridge | null, value: number) {
  await act(async () => {
    root.render(
      <PopulationLoadSlider
        desktop={desktop}
        min={120}
        max={5000}
        step={20}
        value={value}
        onChange={() => {}}
        tickMs={100}
      />,
    )
  })
}

describe('PopulationLoadSlider', () => {
  it('colours the track for the measured machine and rates the chosen size', async () => {
    await renderSlider(desktopWith(m1), 3000)
    const range = container.querySelector('input.fork-load-range') as HTMLInputElement
    expect(range.style.getPropertyValue('--fork-load-track')).toContain('linear-gradient')
    expect(range.style.getPropertyValue('--fork-load-thumb')).toBe('#c4553f')
    const text = container.textContent ?? ''
    expect(text).toContain('Тяжело')
    expect(text).toContain('Этот компьютер: Apple M1, 8 ГБ')
    expect(text).toContain('Оптимально здесь: до 940 жителей')
  })

  it('rates a small world light and says how much faster it can run', async () => {
    await renderSlider(desktopWith(m1), 500)
    const text = container.textContent ?? ''
    expect(text).toContain('Легко')
    expect(text).toMatch(/без перегрузки до 3,\d×/)
  })

  it('measures again on request', async () => {
    const calls: boolean[] = []
    await renderSlider(desktopWith(m1, calls), 500)
    const button = container.querySelector('.fork-load-remeasure') as HTMLButtonElement
    await act(async () => button.click())
    expect(calls).toEqual([false, true])
  })

  it('falls back to a cautious estimate in an older desktop shell', async () => {
    await renderSlider({} as DesktopBridge, 500)
    expect(container.textContent).toContain('Легко')
    expect(container.querySelector('.fork-load-device')).toBeNull()
  })
})
