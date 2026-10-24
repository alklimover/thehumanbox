// Fork: when the simulation pauses or slows the world itself (see ./watch.ts),
// the time control has to learn it. useSimulation hands its runtime re-read
// over here, and the card calls it.

let refresh: () => Promise<void> = async () => {}

/** Keeps the runtime re-read of the live connection; returns it unchanged. */
export function shareRuntimeRefresh<T extends () => Promise<void>>(fn: T): T {
  refresh = fn
  return fn
}

/** Re-reads pause and speed from the simulation. */
export function refreshRuntime(): Promise<void> {
  return refresh()
}
