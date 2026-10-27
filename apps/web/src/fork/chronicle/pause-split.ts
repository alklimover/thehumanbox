// Fork: who stops the clock for what. Upstream's "pause on" (game/model/pause-on.ts, in the ⋯ menu)
// stops the browser's clock while it runs. On the desktop "Don't miss what matters" (./watch.ts) has
// the simulation itself pause or slow the world, with its own rules, so the changes both cover are
// left to it there: upstream's menu offers only the rest (a tribe on the brink, a famine) and its
// watcher never pauses for the others. In the browser there is no simulation-side watch, and
// upstream's menu keeps every change.
import { PAUSE_TRIGGERS, type PauseTrigger } from '../../game/model/pause-on'
import { isDesktop } from '../../shared/desktop'

/** Upstream's triggers that "Don't miss what matters" covers: eras, wars and battles, tribes dying out. */
export const WATCHED_ON_DESKTOP: ReadonlySet<PauseTrigger> = new Set(['era', 'war', 'extinct'])

/** Whether upstream's watcher may pause for this change here. */
export function pausesHere(trigger: PauseTrigger, desktop = isDesktop()): boolean {
  return !(desktop && WATCHED_ON_DESKTOP.has(trigger))
}

/** The changes upstream's "pause on" menu offers here. */
export function pauseTriggersHere(desktop = isDesktop()): readonly PauseTrigger[] {
  return PAUSE_TRIGGERS.filter((trigger) => pausesHere(trigger, desktop))
}
