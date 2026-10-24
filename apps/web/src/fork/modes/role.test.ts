import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DesktopBridge, WorldSlot } from '../../shared/desktop'
import {
  chooseRole,
  guideSeen,
  liveSlotRole,
  loadRole,
  markGuideSeen,
  OLD_WELCOME_KEY,
  PANEL_DEFAULT,
  readBrowserRole,
  readPanelOpen,
  ROLE_KEY,
  setPanelOpen,
  startScreen,
  useModeStore,
  writeBrowserRole,
} from './role'

function memory(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries))
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  }
}

function slot(hash: string, live: boolean, role?: WorldSlot['role']): WorldSlot {
  const s: WorldSlot = { hash, name: null, seed: null, createdAt: null, savedAt: 1, sizeBytes: 1, live }
  return role === undefined ? s : { ...s, role }
}

function desktopWith(list: WorldSlot[] | Error, setRole = vi.fn(async () => list as WorldSlot[])) {
  return {
    forkWorlds: {
      list: async () => {
        if (list instanceof Error) throw list
        return list
      },
      setRole,
    },
  } as unknown as DesktopBridge
}

const fresh = { role: null, ready: false, hash: null, pendingGuide: null }

describe('the browser world’s role', () => {
  it('belongs to the world it was chosen for: a new seed asks again', () => {
    const store = memory({ 'thb-wasm-seed': '42' })
    expect(readBrowserRole(store)).toBeNull()
    writeBrowserRole('god', store)
    expect(JSON.parse(store.map.get(ROLE_KEY)!)).toEqual({ role: 'god', seed: '42' })
    expect(readBrowserRole(store)).toBe('god')
    // "Start a new world" drops the seed; the next world gets its own.
    store.map.set('thb-wasm-seed', '777')
    expect(readBrowserRole(store)).toBeNull()
  })

  it('ignores anything that is not a role', () => {
    expect(readBrowserRole(memory({ [ROLE_KEY]: '{"role":"emperor","seed":null}' }))).toBeNull()
    expect(readBrowserRole(memory({ [ROLE_KEY]: 'not json' }))).toBeNull()
    expect(readBrowserRole(memory({ [ROLE_KEY]: '{"role":"observer"}' }))).toBe('observer')
    expect(readBrowserRole(null)).toBeNull()
  })
})

describe('the first screen', () => {
  it('waits for the role, then asks a world that has none', () => {
    expect(startScreen({ ready: false, role: null })).toBe('wait')
    expect(startScreen({ ready: true, role: null })).toBe('choice')
    expect(startScreen({ ready: true, role: 'observer' })).toBe('none')
  })

  it('asks a player who saw the old welcome card once, and not again after the choice', () => {
    const store = memory({ [OLD_WELCOME_KEY]: '1', 'thb-wasm-seed': '42' })
    const role = readBrowserRole(store)
    expect(startScreen({ ready: true, role })).toBe('choice')
    writeBrowserRole('observer', store)
    expect(startScreen({ ready: true, role: readBrowserRole(store) })).toBe('none')
  })
})

describe('the desktop world’s role', () => {
  it('is the live world’s, and an older shell that knows no roles says nothing', () => {
    expect(liveSlotRole([slot('a', false, 'god'), slot('b', true, null)])).toEqual({ hash: 'b', role: null })
    expect(liveSlotRole([slot('b', true, 'god')])).toEqual({ hash: 'b', role: 'god' })
    expect(liveSlotRole([slot('b', true)])).toBeNull()
    expect(liveSlotRole([])).toBeNull()
  })
})

describe('loading and choosing', () => {
  let store: ReturnType<typeof memory>
  beforeEach(() => {
    store = memory({ 'thb-wasm-seed': '42' })
    vi.stubGlobal('window', { localStorage: store })
    useModeStore.setState(fresh)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reads the role from the desktop list and writes the choice into that world', async () => {
    const setRole = vi.fn(async () => [] as WorldSlot[])
    const desktop = desktopWith([slot('old', false, 'god'), slot('live', true, null)], setRole)
    await loadRole(desktop)
    expect(useModeStore.getState()).toMatchObject({ ready: true, role: null, hash: 'live' })
    chooseRole('observer', desktop)
    expect(setRole).toHaveBeenCalledWith('live', 'observer')
    expect(store.map.has(ROLE_KEY)).toBe(false)
    expect(useModeStore.getState()).toMatchObject({ role: 'observer', pendingGuide: 'observer' })
  })

  it('falls back to the browser’s storage when the desktop list fails or has no roles', async () => {
    writeBrowserRole('god', store)
    await loadRole(desktopWith(new Error('no list')))
    expect(useModeStore.getState()).toMatchObject({ ready: true, role: 'god', hash: null })
    useModeStore.setState(fresh)
    await loadRole(desktopWith([slot('live', true)]))
    expect(useModeStore.getState().role).toBe('god')
    useModeStore.setState(fresh)
    await loadRole(null)
    expect(useModeStore.getState().role).toBe('god')
  })

  it('brings a role’s tips only the first time it is taken', () => {
    chooseRole('god', null)
    expect(useModeStore.getState().pendingGuide).toBe('god')
    markGuideSeen('god')
    expect(guideSeen('god')).toBe(true)
    expect(guideSeen('observer')).toBe(false)
    chooseRole('god', null)
    expect(useModeStore.getState().pendingGuide).toBeNull()
    expect(readBrowserRole(store)).toBe('god')
  })

  it('opens the observer’s panel and folds the god’s by default, then remembers', () => {
    expect(readPanelOpen(store)).toEqual(PANEL_DEFAULT)
    expect(PANEL_DEFAULT).toEqual({ observer: true, god: false })
    setPanelOpen('god', true)
    setPanelOpen('observer', false)
    expect(readPanelOpen(store)).toEqual({ observer: false, god: true })
  })
})
