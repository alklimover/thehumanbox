// What the loading screen says while the world starts, step by step, instead
// of one "waking the world…" for the whole wait. The steps:
//   - desktop: the native simulation starts (Electron waits for it before it
//     loads the page again with its address), the page connects, downloads
//     the world (index.html's own byte counter) and draws the first frame;
//   - browser: the WebAssembly worker loads the engine, reads the save, then
//     restores the world or creates a new one.
// After a few seconds the screen also counts the seconds, so a long start does
// not look stuck.
import { ft, type ForkMessageKey } from './i18n'
import { isDesktopStartupPending } from '../shared/desktopStartup'
import { getWorldSource } from '../simulation/worldSource'

export type BootStage = 'sim' | 'connecting' | 'drawing' | 'engine' | 'reading' | 'restoring' | 'creating'

const TEXT: Record<BootStage, ForkMessageKey> = {
  sim: 'splash.stage.sim',
  connecting: 'splash.stage.connecting',
  drawing: 'splash.stage.drawing',
  engine: 'splash.stage.engine',
  reading: 'splash.stage.reading',
  restoring: 'splash.stage.restoring',
  creating: 'splash.stage.creating',
}

const EVENT = 'thb-boot-stage'
/** Seconds before the screen starts counting them. */
const COUNT_AFTER_S = 3

interface StageDetail {
  stage: BootStage
  tick?: number
}

/** Tell the loading screen the start has reached a step (no-op once it is gone). */
export function bootStage(stage: string, tick?: number): void {
  if (!(stage in TEXT)) return
  window.dispatchEvent(new CustomEvent<StageDetail>(EVENT, { detail: { stage: stage as BootStage, tick } }))
}

function show(detail: StageDetail): void {
  const text = document.getElementById('thb-progress-text')
  if (!text) return
  text.textContent = ft(TEXT[detail.stage], { tick: detail.tick ?? 0 })
}

/** The first step this page can name by itself, before anything reports one. */
export function initialStage(desktop: boolean, search: string, source: string): BootStage | null {
  if (isDesktopStartupPending(desktop, search)) return 'sim'
  return source === 'wasm' ? null : 'connecting'
}

/** Called once from main.tsx, after index.html's own progress handler. */
export function installBootStages(): void {
  const splash = document.getElementById('thb-splash')
  if (!splash) return
  window.addEventListener(EVENT, (e) => show((e as CustomEvent<StageDetail>).detail))
  // The download is the last step before drawing: once it is complete, say so.
  window.addEventListener('thb-snapshot-progress', (e) => {
    const { loaded, total } = (e as CustomEvent<{ loaded: number; total: number | null }>).detail
    if (total && loaded >= total) show({ stage: 'drawing' })
  })
  const first = initialStage(!!window.thbDesktop, window.location.search, getWorldSource())
  if (first) show({ stage: first })

  const elapsed = document.createElement('div')
  elapsed.className = 'thb-sub thb-elapsed'
  elapsed.setAttribute('aria-hidden', 'true')
  document.getElementById('thb-progress-text')?.after(elapsed)
  const started = performance.now()
  const timer = setInterval(() => {
    if (!document.getElementById('thb-splash') || splash.classList.contains('hide')) {
      clearInterval(timer)
      return
    }
    const s = Math.floor((performance.now() - started) / 1000)
    elapsed.textContent = s >= COUNT_AFTER_S ? ft('splash.elapsed', { s }) : ''
  }, 1000)
}
