// The tour runner is only needed when someone starts the tour, so it lives in
// tour-runner.ts and is fetched on demand.
import { logger } from '../../shared/logger'
import { isPhoneViewport } from '../../shared/phone'
import type { PlayerWorldKind } from '../../simulation/worldSource'
import { startModeGuide } from '../../fork/modes/guide'
import { useModeStore } from '../../fork/modes/role'

const TOUR_KEY = 'thb-tour-completed-v1'

export function isTourSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !isPhoneViewport()
}

export function markSeen() {
  try {
    window.localStorage.setItem(TOUR_KEY, '1')
  } catch {
    /* ignore */
  }
}

const loadRunner = () => import('./tour-runner')

/** Starts fetching the tour code ahead of a likely start (the welcome flow). */
export function preloadTour() {
  if (isTourSupported()) void loadRunner().catch(() => undefined)
}

export function startTour(worldKind: PlayerWorldKind = 'local') {
  // Fork: once the world has a mode, its tips stand in for the tour.
  if (useModeStore.getState().role) return startModeGuide()
  if (!isTourSupported()) {
    markSeen()
    return
  }
  loadRunner()
    .then((m) => m.runTour(worldKind))
    .catch((error: unknown) => logger.error('tour', 'could not start the tour', error))
}
