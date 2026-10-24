// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleForTests } from '../../i18n/locale'
import type { ChronicleEntry } from './model'
import { WholeHistory } from './WholeHistory'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const YEAR = 12000
let container: HTMLDivElement
let root: Root
let calls: string[]

function row(id: number, tick: number, over: Partial<ChronicleEntry> = {}): ChronicleEntry {
  return {
    id,
    tick,
    src: 'event',
    kind: 'era_advance',
    cat: 'eras',
    actor: 'Kefe',
    text: 'Kefe entered the iron era: Iron replaces bronze in the fields and at war.',
    era: 'iron',
    tribes: [{ id: 'aaaa1111', name: 'Kefe' }],
    ...over,
  }
}

/** Serves pages by the query: the first page, the next one, the refresh of the top. */
function serve(pages: (url: URL) => object) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const url = new URL(input)
      calls.push(`${url.pathname}?${url.searchParams.toString()}`)
      const body =
        url.pathname === '/chronicle/tribes'
          ? {
              ok: true,
              tribes: [
                {
                  id: 'aaaa1111',
                  name: 'Kefe',
                  first_tick: 0,
                  last_tick: 1,
                  died_out_tick: null,
                  peak: 9,
                  entries: 3,
                },
                {
                  id: 'bbbb2222',
                  name: 'Zovu',
                  first_tick: 0,
                  last_tick: 1,
                  died_out_tick: 50,
                  peak: 4,
                  entries: 1,
                },
              ],
            }
          : pages(url)
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
    }),
  )
}

async function render() {
  await act(async () => {
    root.render(<WholeHistory />)
  })
  await act(async () => {
    await Promise.resolve()
  })
}

const text = () => container.textContent ?? ''

beforeEach(() => {
  setLocaleForTests('ru')
  vi.useFakeTimers({ shouldAdvanceTime: true })
  calls = []
  // Node's own localStorage stands in front of the DOM one: give the tab a plain store.
  const data = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    },
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  setLocaleForTests('en')
})

describe('the whole history tab', () => {
  it('shows the years with their era and count, newest first, and what the chronicle began with', async () => {
    serve(() => ({
      ok: true,
      rows: [
        row(3, 4 * YEAR + 7000),
        row(2, 3 * YEAR + 100, {
          src: 'server',
          kind: 'died_out',
          cat: 'tribes',
          actor: 'Zovu',
          text: 'The Zovu have died out.',
          tribes: [{ id: 'bbbb2222', name: 'Zovu' }],
        }),
      ],
      more: false,
      started_tick: 2 * YEAR,
      total: 79,
      years: [
        { year: 4, count: 42, era: 'iron' },
        { year: 3, count: 37, era: 'bronze' },
      ],
    }))
    await render()
    const heads = [...container.querySelectorAll('.fch-year-head')].map((h) => h.textContent)
    expect(heads).toEqual(['Год 5 · железный век42', 'Год 4 · бронзовый век37'])
    expect(text()).toContain('Кефе — новая эпоха: железный век.')
    expect(text()).toContain('зима')
    // A tribe with nobody left: its line, no button, the mark.
    expect(text()).toContain('Племя Зову вымерло, а когда-то в нём было 4 человека.')
    expect(container.querySelectorAll('.fch-go-btn')).toHaveLength(1)
    expect(container.querySelector('.fch-gone')?.textContent).toBe('(вымерли)')
    expect(text()).toContain('79 записей')
    expect(text()).toContain('летопись ведётся с года 3')
    // The tribe filter lists the chronicle's own tribes, the dead ones marked.
    const options = [...container.querySelectorAll('.fch-tribe option')].map((o) => o.textContent)
    expect(options).toEqual(['все', 'Кефе', 'Зову (вымерли)'])
  })

  it('asks for the chosen headings and tribe, and keeps people off by default', async () => {
    serve(() => ({ ok: true, rows: [], more: false, started_tick: 0, total: 0, years: [] }))
    await render()
    const first = calls.find((c) => c.startsWith('/chronicle?'))!
    expect(first).toContain('kinds=eras%2Cwar%2Cfaith%2Cdiscovery%2Cdisaster%2Ctribes%2Cmilestones%2Cother')
    expect(text()).toContain('По этим разделам пока ничего нет.')

    const people = [...container.querySelectorAll<HTMLButtonElement>('.fch-chip')].find((b) =>
      b.textContent?.includes('Люди'),
    )!
    expect(people.getAttribute('aria-pressed')).toBe('false')
    calls = []
    await act(async () => people.click())
    expect(calls.some((c) => c.includes('people'))).toBe(true)
    expect(JSON.parse(window.localStorage.getItem('thb.fork.chronicle.categories')!)).toContain('people')

    calls = []
    const select = container.querySelector<HTMLSelectElement>('.fch-tribe select')!
    await act(async () => {
      select.value = 'bbbb2222'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(calls.some((c) => c.includes('lineage=bbbb2222'))).toBe(true)
  })

  it('loads older pages on scroll and new lines on top every two seconds', async () => {
    serve((url) => {
      if (url.searchParams.has('before_tick')) {
        return { ok: true, rows: [row(1, 10)], more: false, started_tick: 0 }
      }
      if (url.searchParams.has('after_id')) {
        return { ok: true, rows: [row(9, 5 * YEAR, { id: 9 })], more: false, started_tick: 0 }
      }
      return {
        ok: true,
        rows: [row(5, 4 * YEAR), row(4, 3 * YEAR)],
        more: true,
        started_tick: 0,
        total: 3,
        years: [
          { year: 4, count: 1, era: 'iron' },
          { year: 3, count: 1, era: 'iron' },
          { year: 0, count: 1, era: 'stone' },
        ],
      }
    })
    await render()
    expect(container.querySelectorAll('.fch-row')).toHaveLength(2)

    const list = container.querySelector<HTMLDivElement>('.fch-list')!
    await act(async () => {
      list.dispatchEvent(new Event('scroll', { bubbles: true }))
      await Promise.resolve()
    })
    expect(calls.some((c) => c.includes('before_tick=36000&before_id=4'))).toBe(true)
    expect(container.querySelectorAll('.fch-row')).toHaveLength(3)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })
    expect(calls.some((c) => c.includes('after_id=5'))).toBe(true)
    const heads = [...container.querySelectorAll('.fch-year-head')].map((h) => h.textContent)
    expect(heads[0]).toBe('Год 6 · железный век1')
    expect(text()).toContain('4 записи')
  })

  it('says so when the chronicle cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) })),
    )
    await render()
    expect(text()).toContain('Не удалось прочитать летопись: HTTP 503')
  })
})
