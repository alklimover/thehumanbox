// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleForTests } from '../../i18n/locale'
import type { DesktopBridge } from '../../shared/desktop'
import { useUIStore } from '../../state/store'
import { ImportantMoment } from './ImportantMoment'
import { shareRuntimeRefresh } from './runtime-refresh'
import { defaultSettings, useWatchSettings, type ServerWatch, type WatchAlert } from './watch'
import { WatchSection } from './WatchSection'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const YEAR = 12000
let container: HTMLDivElement
let root: Root
let alerts: WatchAlert[]
let server: ServerWatch
let posts: unknown[]

function eraAlert(id: number): WatchAlert {
  return {
    id,
    tick: 3 * YEAR + 6500,
    action: 'pause',
    prev_speed: 50,
    main: {
      tick: 3 * YEAR + 6500,
      src: 'event',
      kind: 'era',
      cat: 'eras',
      actor: 'world',
      text: 'the classical era begins: Writing, law and coinage bind the tribes into cities.',
      era: 'classical',
      tribes: [],
      rule: 'world_era',
    },
    also: [
      {
        tick: 3 * YEAR + 6400,
        src: 'event',
        kind: 'war_declared',
        cat: 'war',
        actor: 'aaaa1111',
        text: 'aaaa1111 declared war on bbbb2222 over the border at (1,2)',
        era: 'iron',
        tribes: [
          { id: 'aaaa1111', name: 'Zovu' },
          { id: 'bbbb2222', name: 'Diwhabo' },
        ],
        rule: 'war',
      },
    ],
    also_total: 1,
    focus: { id: 'cccc3333', name: 'Kefe' },
  }
}

function serve() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: RequestInit) => {
      const url = new URL(input)
      if (url.pathname === '/chronicle/watch') {
        posts.push(JSON.parse(String(init?.body)))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, watch: server }) })
      }
      const after = Number(url.searchParams.get('after'))
      const body = {
        ok: true,
        alerts: alerts.filter((a) => a.id > after),
        latest_id: alerts[alerts.length - 1]?.id ?? 0,
        watch: server,
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
    }),
  )
}

const setSpeed = vi.fn(() => Promise.resolve(true))
const resume = vi.fn(() => Promise.resolve(true))
const refresh = vi.fn(() => Promise.resolve())

async function render(node = <ImportantMoment setSpeed={setSpeed} resume={resume} />) {
  await act(async () => {
    root.render(node)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10)
  })
}

async function second() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
}

const card = () => container.querySelector('.fmoment')

beforeEach(() => {
  setLocaleForTests('ru')
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const data = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    },
  })
  window.thbDesktop = {} as DesktopBridge
  useWatchSettings.setState({ settings: defaultSettings() })
  const d = defaultSettings()
  server = { enabled: d.enabled, debounce_secs: d.debounceSecs, rules: { ...d.rules }, focus: null }
  alerts = []
  posts = []
  setSpeed.mockClear()
  resume.mockClear()
  refresh.mockClear()
  shareRuntimeRefresh(refresh)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  delete window.thbDesktop
  vi.useRealTimers()
  vi.unstubAllGlobals()
  setLocaleForTests('en')
})

describe('the important-moment card', () => {
  it('does not bring back a card from before, then shows the next one and tells the time control', async () => {
    alerts = [eraAlert(1)]
    serve()
    await render()
    expect(card()).toBeNull()

    alerts.push(eraAlert(2))
    await second()
    expect(card()).not.toBeNull()
    expect(refresh).toHaveBeenCalled()
    const text = card()!.textContent!
    expect(text).toContain('⏸ Мир на паузе — важный момент')
    expect(text).toContain('Год 4, зима')
    expect(text).toContain('В мире наступает новая эпоха: античность.')
    expect(text).toContain('Первым до неё дошло племя Кефе.')
    expect(text).toContain('Ещё за это время (1):')
    expect(text).toContain('Зову из-за спорной границы объявляет войну Дивхабо')
    expect(text).toContain('Продолжить на 50×')
    expect(text).toContain('Не останавливать на «Новая эпоха мира»')
  })

  it('continues the way the time control does, and closes', async () => {
    serve()
    await render()
    alerts = [eraAlert(1)]
    await second()
    const continueButton = [...card()!.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith('Продолжить'),
    )!
    await act(async () => continueButton.click())
    expect(resume).toHaveBeenCalledTimes(1)
    expect(setSpeed).not.toHaveBeenCalled()
    expect(card()).toBeNull()

    // A slow-down goes back to the speed it ran at.
    alerts.push({ ...eraAlert(2), action: 'slow', prev_speed: 20 })
    await second()
    expect(card()!.textContent).toContain('🐢 Замедлено до 1× — важный момент')
    await act(async () =>
      [...card()!.querySelectorAll('button')].find((b) => b.textContent?.startsWith('Продолжить'))!.click(),
    )
    expect(setSpeed).toHaveBeenCalledWith(20)
  })

  it('closes on Escape and leaves the world as it is', async () => {
    serve()
    await render()
    alerts = [eraAlert(1)]
    await second()
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(card()).toBeNull()
    expect(resume).not.toHaveBeenCalled()
    expect(setSpeed).not.toHaveBeenCalled()
  })

  it('turns the rule off from the card, and sends the change and the focus', async () => {
    serve()
    await render()
    alerts = [eraAlert(1)]
    await second()
    const box = card()!.querySelector<HTMLInputElement>('input[type=checkbox]')!
    await act(async () => box.click())
    expect(useWatchSettings.getState().settings.rules.world_era).toBe('ignore')
    await act(async () => useUIStore.getState().setFocus('lineage:aaaa1111'))
    await second()
    const last = posts[posts.length - 1] as { rules: Record<string, string>; focus: string }
    expect(last.rules.world_era).toBe('ignore')
    expect(last.focus).toBe('aaaa1111')
    await act(async () => useUIStore.getState().setFocus('all'))
  })

  it('opens the whole history from the card', async () => {
    serve()
    await render()
    alerts = [eraAlert(1)]
    await second()
    await act(async () =>
      [...card()!.querySelectorAll('button')].find((b) => b.textContent === 'Летопись')!.click(),
    )
    expect(useUIStore.getState().showChronicles).toBe(true)
    await act(async () => useUIStore.getState().closeChronicles())
  })

  it('is not there in the browser', async () => {
    delete window.thbDesktop
    serve()
    await render()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('the settings section', () => {
  it('switches the stops off, picks the pause between them and each rule, and goes back to the defaults', async () => {
    await render(<WatchSection />)
    const text = container.textContent!
    expect(text).toContain('Не пропустить важное')
    expect(text).toContain('Новая эпоха любого племени (часто)')
    const enabled = container.querySelector<HTMLInputElement>('input[type=checkbox]')!
    expect(enabled.checked).toBe(true)
    await act(async () => enabled.click())
    expect(useWatchSettings.getState().settings.enabled).toBe(false)
    await act(async () => enabled.click())

    const threeMin = [...container.querySelectorAll('label')].find((l) => l.textContent === '3 мин')!
    await act(async () => threeMin.querySelector('input')!.click())
    expect(useWatchSettings.getState().settings.debounceSecs).toBe(180)

    const warPause = container.querySelector<HTMLInputElement>('input[aria-label="Объявлена война: Пауза"]')!
    await act(async () => warPause.click())
    expect(useWatchSettings.getState().settings.rules.war).toBe('pause')
    expect(JSON.parse(window.localStorage.getItem('thb.fork.watch')!).rules.war).toBe('pause')

    const reset = [...container.querySelectorAll('button')].find((b) => b.textContent === 'вернуть как было')!
    await act(async () => reset.click())
    expect(useWatchSettings.getState().settings).toEqual(defaultSettings())
  })
})
