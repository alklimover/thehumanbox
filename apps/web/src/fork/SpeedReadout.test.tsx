// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleForTests } from '../i18n/locale'
import type { DesktopBridge } from '../shared/desktop'
import { TimeControl } from '../ui/toolbar/TimeControl'
import type { SimPowerState } from './actual-speed'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
let powerListener: ((state: SimPowerState) => void) | null

function desktopWith(power: SimPowerState) {
  window.thbDesktop = {
    forkPower: {
      state: () => Promise.resolve(power),
      onChange: (cb: (state: SimPowerState) => void) => {
        powerListener = cb
        return () => {
          powerListener = null
        }
      },
    },
  } as unknown as DesktopBridge
}

function serveRuntime(body: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })),
  )
}

async function render(speed: number, paused = false) {
  await act(async () => {
    root.render(<TimeControl paused={paused} speed={speed} onPick={() => {}} />)
  })
}

const value = () => container.querySelector('.time-speed-value')?.textContent

beforeEach(() => {
  setLocaleForTests('ru')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  powerListener = null
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  delete window.thbDesktop
  vi.unstubAllGlobals()
  setLocaleForTests('en')
})

describe('the real speed on the desktop', () => {
  it('shows what the world really runs at beside the speed asked for', async () => {
    desktopWith({ managed: true, mode: 'performance', reason: null })
    serveRuntime({ ok: true, paused: false, speed: 40, tick_ms: 20, actual_speed: 6.2 })
    await render(40)
    expect(value()).toBe('6,2× из 40×')
    expect(container.querySelector('.time-lag')).not.toBeNull()
  })

  it('shows only the speed asked for while the world keeps up', async () => {
    desktopWith({ managed: true, mode: 'performance', reason: null })
    serveRuntime({ ok: true, paused: false, speed: 4, tick_ms: 25, actual_speed: 3.9 })
    await render(4)
    expect(value()).toBe('4×')
  })

  it('ignores a reading taken at another speed', async () => {
    desktopWith({ managed: true, mode: 'performance', reason: null })
    serveRuntime({ ok: true, paused: false, speed: 2, tick_ms: 50, actual_speed: 2 })
    await render(40)
    expect(value()).toBe('40×')
  })

  it('does not ask while time is stopped', async () => {
    desktopWith({ managed: true, mode: 'performance', reason: null })
    serveRuntime({ ok: true, paused: true, speed: 40, tick_ms: 20, actual_speed: null })
    await render(40, true)
    expect(fetch).not.toHaveBeenCalled()
    expect(value()).toBe('40×')
  })

  it('marks a world on the efficiency cores, and follows the shell when that changes', async () => {
    desktopWith({ managed: true, mode: 'efficiency', reason: 'battery' })
    serveRuntime({ ok: true, paused: false, speed: 40, tick_ms: 20, actual_speed: 0.7 })
    await render(40)
    expect(value()).toBe('0,7× из 40×эко')
    act(() => powerListener?.({ managed: true, mode: 'performance', reason: null }))
    expect(container.querySelector('.fork-speed-eco')).toBeNull()
  })
})
