import type { DesktopVisibility } from './desktopVisibility'

export type SimMode = 'local'
export type { DesktopVisibility } from './desktopVisibility'

export interface DesktopSettings {
  mode: SimMode
  tickMs: number
  populationCap: number
  saveLocationOverride: string | null
  autoUpdate: boolean
  autoLaunch: boolean
  startMinimized: boolean
  pauseWhenHidden: boolean
}

export interface SimStatus {
  running: boolean
  port: number | null
  mode?: SimMode
  error?: string
}

export interface UpdateInfo {
  version: string
  releaseDate?: string
}

export type UpdateCheckStatus =
  'checking' | 'available' | 'downloaded' | 'up-to-date' | 'unsupported' | 'error'

export interface UpdateCheckResult {
  status: UpdateCheckStatus
  version?: string
  releaseDate?: string
  message?: string
}

/** Fork: a world on disk (apps/desktop/main/fork-worlds.ts). */
export interface WorldSlot {
  hash: string
  name: string | null
  seed: string | null
  createdAt: number | null
  savedAt: number
  sizeBytes: number
  live: boolean
}

export interface DesktopBridge {
  isDesktop: true
  platform: string
  appVersion: string
  settings: {
    get(): Promise<DesktopSettings>
    set(next: DesktopSettings): Promise<DesktopSettings>
  }
  sim: {
    status(): Promise<SimStatus>
    restart(): Promise<SimStatus>
  }
  app: {
    reload(): Promise<void>
    notify(payload: { title: string; body: string }): Promise<void>
    trayToggle(): Promise<void>
    screenshot(): Promise<string | null>
    openLogs(): Promise<void>
    openWorlds(): Promise<void>
    applyAutoLaunch(): Promise<void>
    pickSaveDir(): Promise<string | null>
    checkForUpdates(): Promise<UpdateCheckResult>
    installUpdate(): Promise<UpdateCheckResult>
    /** Fork: tells the desktop shell which language the interface runs in (menus, dialogs). */
    setLocale?(locale: string): Promise<void>
  }
  world: {
    migrateDataRoot(payload: { targetDir: string | null }): Promise<{
      settings: DesktopSettings
      migrated: boolean
      previousFolderKept?: string
    }>
    exportActive(): Promise<{ exported: boolean; filePath?: string; hash?: string }>
    resetLocal(): Promise<{ reset: boolean; exported?: boolean; filePath?: string; port?: number }>
  }
  /** Fork: the worlds on disk as save slots. Missing in an older desktop shell. */
  forkWorlds?: {
    list(): Promise<WorldSlot[]>
    open(hash: string): Promise<{ opened: boolean }>
    create(options: {
      seed?: string | null
      populationCap?: number | null
      name?: string | null
    }): Promise<{ created: boolean; hash: string; seed: string }>
    rename(hash: string, name: string): Promise<WorldSlot[]>
    trash(hash: string): Promise<WorldSlot[]>
  }
  on(
    channel: 'updater:available' | 'updater:downloaded',
    cb: (payload: UpdateInfo | null) => void,
  ): () => void
  on(channel: 'updater:error', cb: (payload: { message: string } | null) => void): () => void
  on(channel: 'menu:openSettings', cb: (payload: null) => void): () => void
  on(channel: 'app:visibility', cb: (payload: DesktopVisibility) => void): () => void
}

declare global {
  interface Window {
    thbDesktop?: DesktopBridge
  }
}

export function getDesktop(): DesktopBridge | null {
  if (typeof window === 'undefined') return null
  return window.thbDesktop ?? null
}

export function isDesktop(): boolean {
  return !!getDesktop()
}
