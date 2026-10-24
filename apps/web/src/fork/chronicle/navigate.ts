// Fork: getting from the chronicle to the map.
import { isDesktop } from '../../shared/desktop'
import { useCameraFocus } from '../../state/camera-focus'
import { useUIStore } from '../../state/store'
import { useWorldStore } from '../../state/worldStore'

/** The tab exists in the desktop app, whose simulation keeps the chronicle. */
export function wholeHistoryTab(): 'all'[] {
  return isDesktop() ? ['all'] : []
}

/** Focus a tribe and move the camera to its home (or its people), as the event feed does. */
export function goToTribe(lineage: string) {
  const world = useWorldStore.getState().world
  const ui = useUIStore.getState()
  ui.setFocus(`lineage:${lineage}`)
  ui.closeChronicles()
  if (!world) return
  const home = world.settlements?.find((s) => s.lineage_id === lineage)
  let at: { x: number; y: number } | null = home ? { x: home.center[0], y: home.center[1] } : null
  if (!at) {
    const people = world.organisms.filter((o) => o.alive !== false && o.lineage_id === lineage)
    if (people.length > 0) {
      at = {
        x: people.reduce((n, o) => n + o.x, 0) / people.length,
        y: people.reduce((n, o) => n + o.y, 0) / people.length,
      }
    }
  }
  if (at) useCameraFocus.getState().focusTile(Math.round(at.x), Math.round(at.y))
}

let wantWholeHistory = false

/** Opens the Chronicles on the "Whole history" tab (the card's "Chronicle" button). */
export function openWholeHistory() {
  wantWholeHistory = true
  useUIStore.getState().openChronicles()
}

/** The tab the Chronicles open on: "Whole history" once after openWholeHistory, else `fallback`. */
export function initialChronicleTab<T extends string>(fallback: T): T | 'all' {
  const want = wantWholeHistory
  wantWholeHistory = false
  return want && isDesktop() ? 'all' : fallback
}
