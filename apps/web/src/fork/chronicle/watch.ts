// Fork: "Don't miss what matters". The desktop simulation pauses or slows the
// world itself, in the tick that wrote the line (apps/server/src/fork_chronicle/watch.rs);
// the player's choices are kept here and sent to it, and its alerts are read
// back for the card (ImportantMoment.tsx).
import { create } from 'zustand'
import type { MessageKey } from '../../i18n'
import { API_BASE, sandboxHeaders } from '../../shared/config'
import type { ChronicleTribeLink } from './model'

export type WatchAction = 'ignore' | 'slow' | 'pause'

/** The rules in the order the settings list them, with their defaults (the same as the server's). */
export const RULES = [
  ['world_era', 'pause'],
  ['focus_era', 'pause'],
  ['tribe_era', 'ignore'],
  ['died_out', 'pause'],
  ['split', 'slow'],
  ['war', 'slow'],
  ['uprising', 'slow'],
  ['wonder', 'slow'],
  ['disaster', 'slow'],
  ['epidemic', 'ignore'],
  ['battles', 'ignore'],
  ['faith', 'ignore'],
] as const satisfies readonly (readonly [string, WatchAction])[]

export type WatchRule = (typeof RULES)[number][0]

export const RULE_LABEL: Record<WatchRule, MessageKey> = {
  world_era: 'watch.rule.world_era',
  focus_era: 'watch.rule.focus_era',
  tribe_era: 'watch.rule.tribe_era',
  died_out: 'watch.rule.died_out',
  split: 'watch.rule.split',
  war: 'watch.rule.war',
  uprising: 'watch.rule.uprising',
  wonder: 'watch.rule.wonder',
  disaster: 'watch.rule.disaster',
  epidemic: 'watch.rule.epidemic',
  battles: 'watch.rule.battles',
  faith: 'watch.rule.faith',
}

export const ACTIONS: readonly WatchAction[] = ['ignore', 'slow', 'pause']
export const DEBOUNCE_CHOICES = [30, 60, 180] as const

export interface WatchSettings {
  /** On by default, in both the observer and the god mode. */
  enabled: boolean
  debounceSecs: number
  rules: Record<WatchRule, WatchAction>
}

export function defaultSettings(): WatchSettings {
  return {
    enabled: true,
    debounceSecs: 60,
    rules: Object.fromEntries(RULES.map(([rule, action]) => [rule, action])) as Record<
      WatchRule,
      WatchAction
    >,
  }
}

const STORAGE_KEY = 'thb.fork.watch'

/** The saved choices over the defaults: unknown rules and values are dropped. */
export function readSettings(storage: Pick<Storage, 'getItem'> | null): WatchSettings {
  const out = defaultSettings()
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return out
    const saved = JSON.parse(raw) as Partial<{ enabled: unknown; debounceSecs: unknown; rules: unknown }>
    if (typeof saved.enabled === 'boolean') out.enabled = saved.enabled
    if (DEBOUNCE_CHOICES.includes(saved.debounceSecs as never))
      out.debounceSecs = saved.debounceSecs as number
    if (saved.rules && typeof saved.rules === 'object') {
      for (const [rule, action] of Object.entries(saved.rules as Record<string, unknown>)) {
        if (rule in out.rules && ACTIONS.includes(action as WatchAction)) {
          out.rules[rule as WatchRule] = action as WatchAction
        }
      }
    }
  } catch {
    /* unreadable: the defaults */
  }
  return out
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

interface WatchStore {
  settings: WatchSettings
  set: (change: Partial<Omit<WatchSettings, 'rules'>> & { rules?: Partial<WatchSettings['rules']> }) => void
  reset: () => void
}

/** The player's choices, kept in this browser profile and shared by the card and the settings. */
export const useWatchSettings = create<WatchStore>((set) => ({
  settings: readSettings(storage()),
  set: (change) =>
    set((s) => {
      const settings = { ...s.settings, ...change, rules: { ...s.settings.rules, ...change.rules } }
      try {
        storage()?.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch {
        /* private mode: kept for this session */
      }
      return { settings }
    }),
  reset: () =>
    set(() => {
      try {
        storage()?.setItem(STORAGE_KEY, JSON.stringify(defaultSettings()))
      } catch {
        /* private mode */
      }
      return { settings: defaultSettings() }
    }),
}))

/** What the server holds (`watch` in its answers). */
export interface ServerWatch {
  enabled: boolean
  debounce_secs: number
  rules: Record<string, WatchAction>
  focus: string | null
}

/** Whether the server holds other choices than these (it starts from the defaults after a restart). */
export function differs(
  server: ServerWatch | undefined,
  settings: WatchSettings,
  focus: string | null,
): boolean {
  if (!server) return true
  if (server.enabled !== settings.enabled || server.debounce_secs !== settings.debounceSecs) return true
  if ((server.focus ?? null) !== focus) return true
  return RULES.some(([rule]) => server.rules[rule] !== settings.rules[rule])
}

export async function sendSettings(
  settings: WatchSettings,
  focus: string | null,
): Promise<ServerWatch | null> {
  const response = await fetch(`${API_BASE}/chronicle/watch`, {
    method: 'POST',
    headers: sandboxHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({
      enabled: settings.enabled,
      debounce_secs: settings.debounceSecs,
      rules: settings.rules,
      focus,
    }),
  })
  if (!response.ok) return null
  return ((await response.json()) as { watch?: ServerWatch }).watch ?? null
}

/** A line as an alert carries it (a chronicle entry without its id). */
export interface AlertLine {
  tick: number
  src: string
  kind: string
  cat: string
  actor: string
  text: string
  era: string
  tribes: ChronicleTribeLink[]
  rule: WatchRule
}

export interface WatchAlert {
  id: number
  tick: number
  action: Exclude<WatchAction, 'ignore'>
  /** The speed the world ran at before the stop. */
  prev_speed: number
  main: AlertLine
  also: AlertLine[]
  also_total: number
  focus: ChronicleTribeLink | null
}

export interface AlertsAnswer {
  alerts: WatchAlert[]
  latest_id: number
  watch?: ServerWatch
}

export async function fetchAlerts(after: number, signal?: AbortSignal): Promise<AlertsAnswer> {
  const response = await fetch(`${API_BASE}/chronicle/alerts?after=${after}`, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as AlertsAnswer
}

/** "Also meanwhile": the first few lines and how many more there were. */
export function alsoShown(alert: WatchAlert, max = 4): { lines: AlertLine[]; more: number } {
  const lines = alert.also.slice(0, max)
  return { lines, more: Math.max(0, alert.also_total - lines.length) }
}

/** The tribe in the player's focus: a focused tribe, or the selected person's. */
export function focusedTribe(
  focus: string,
  selectedOrgId: string | null,
  people: readonly { id: string; lineage_id: string }[] | undefined,
): string | null {
  if (focus.startsWith('lineage:')) return focus.slice('lineage:'.length) || null
  if (selectedOrgId) return people?.find((o) => o.id === selectedOrgId)?.lineage_id ?? null
  return null
}
