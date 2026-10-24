// Fork: how the player plays a world, as an observer or as its god
// (docs/fork/MODES.ru.md). Each world keeps its own: the desktop app writes it
// into the world's fork-world.json (apps/desktop/main/fork-worlds.ts); the
// browser has one world and keeps it in localStorage, beside the seed of the
// world it was chosen for, so a new world asks again.
import { create } from 'zustand'
import type { DesktopBridge, WorldRole, WorldSlot } from '../../shared/desktop'
import { logger } from '../../shared/logger'

export type Role = WorldRole

export const ROLES: readonly Role[] = ['observer', 'god']

export const ROLE_ICONS: Record<Role, string> = { observer: '👁️', god: '⚡' }

/** The browser world's role: `{ role, seed }`. */
export const ROLE_KEY = 'thb-fork-role-v1'
/** The browser world's seed, kept by simulation/worldSource.ts; a new world gets a new one. */
const SEED_KEY = 'thb-wasm-seed'
/** Set by the welcome card that the role choice replaced (ui/modals/WelcomeModal.tsx). */
export const OLD_WELCOME_KEY = 'thb-welcome-seen-v1'
/** The mode tips seen, one flag per role. */
const GUIDE_KEY = 'thb-fork-guide-seen-v1:'
/** Whether the mode panel is open, per role: `{ observer, god }`. */
const PANEL_KEY = 'thb-fork-panel-v1'

type Store = Pick<Storage, 'getItem' | 'setItem'>

function storage(): Store | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function parseRole(value: unknown): Role | null {
  return value === 'observer' || value === 'god' ? value : null
}

/** The browser world's role, or null when it has none or it was chosen for another world. */
export function readBrowserRole(store: Store | null = storage()): Role | null {
  if (!store) return null
  try {
    const saved = JSON.parse(store.getItem(ROLE_KEY) ?? 'null') as { role?: unknown; seed?: unknown } | null
    if (!saved || typeof saved !== 'object') return null
    const seed = store.getItem(SEED_KEY)
    return (saved.seed ?? null) === seed ? parseRole(saved.role) : null
  } catch {
    return null
  }
}

export function writeBrowserRole(role: Role, store: Store | null = storage()): void {
  try {
    store?.setItem(ROLE_KEY, JSON.stringify({ role, seed: store.getItem(SEED_KEY) }))
  } catch {
    // The choice holds for this visit; the next one asks again.
  }
}

export function guideSeen(role: Role, store: Store | null = storage()): boolean {
  try {
    return store?.getItem(GUIDE_KEY + role) === '1'
  } catch {
    return true
  }
}

export function markGuideSeen(role: Role, store: Store | null = storage()): void {
  try {
    store?.setItem(GUIDE_KEY + role, '1')
  } catch {
    /* the tips show again next time */
  }
}

/** The observer's panel starts open; the god has the prayer bubbles and the chip, and opens it when wanted. */
export const PANEL_DEFAULT: Record<Role, boolean> = { observer: true, god: false }

export function readPanelOpen(store: Store | null = storage()): Record<Role, boolean> {
  try {
    const saved = JSON.parse(store?.getItem(PANEL_KEY) ?? 'null') as Partial<Record<Role, unknown>> | null
    return {
      observer: typeof saved?.observer === 'boolean' ? saved.observer : PANEL_DEFAULT.observer,
      god: typeof saved?.god === 'boolean' ? saved.god : PANEL_DEFAULT.god,
    }
  } catch {
    return { ...PANEL_DEFAULT }
  }
}

/**
 * What greets the player: nothing until the world's role is known, then the
 * choice for a world without one. That is every world from before the modes
 * too, so a player who saw the old welcome card is asked once per such world
 * and never again after choosing; the old card's flag does not matter.
 */
export function startScreen(state: { ready: boolean; role: Role | null }): 'wait' | 'choice' | 'none' {
  if (!state.ready) return 'wait'
  return state.role ? 'none' : 'choice'
}

/** The playing world in a desktop list, and its role if this shell knows roles at all. */
export function liveSlotRole(list: readonly WorldSlot[]): { hash: string; role: Role | null } | null {
  const live = list.find((w) => w.live)
  if (!live || !('role' in live)) return null
  return { hash: live.hash, role: parseRole(live.role) }
}

interface ModeState {
  role: Role | null
  /** False while the desktop app is still reading the worlds list. */
  ready: boolean
  /** The desktop world the role belongs to; null in the browser. */
  hash: string | null
  /** Tips to show once nothing else is open: the first time a role is taken. */
  pendingGuide: Role | null
  panelOpen: Record<Role, boolean>
}

export const useModeStore = create<ModeState>()(() => ({
  role: null,
  ready: false,
  hash: null,
  pendingGuide: null,
  panelOpen: readPanelOpen(),
}))

export function setPanelOpen(role: Role, open: boolean): void {
  const panelOpen = { ...useModeStore.getState().panelOpen, [role]: open }
  useModeStore.setState({ panelOpen })
  try {
    storage()?.setItem(PANEL_KEY, JSON.stringify(panelOpen))
  } catch {
    /* remembered for this visit */
  }
}

export function useRole(): Role | null {
  return useModeStore((s) => s.role)
}

/** Reads the current world's role once, at start-up. */
export async function loadRole(desktop: DesktopBridge | null): Promise<void> {
  const worlds = desktop?.forkWorlds
  if (worlds?.setRole) {
    try {
      const live = liveSlotRole(await worlds.list())
      if (live) {
        useModeStore.setState({ role: live.role, hash: live.hash, ready: true })
        return
      }
    } catch (error) {
      logger.error('modes', 'could not read the worlds list', error)
    }
  }
  useModeStore.setState({ role: readBrowserRole(), hash: null, ready: true })
}

/** Takes a role for this world; its tips follow the first time it is taken. */
export function chooseRole(role: Role, desktop: DesktopBridge | null): void {
  const { hash } = useModeStore.getState()
  useModeStore.setState({ role, ready: true, pendingGuide: guideSeen(role) ? null : role })
  const setRole = desktop?.forkWorlds?.setRole
  if (hash && setRole) {
    setRole(hash, role).catch((error: unknown) => logger.error('modes', 'could not save the role', error))
  } else {
    writeBrowserRole(role)
  }
}
