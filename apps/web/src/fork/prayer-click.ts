// Fork: what a click on a prayer bubble does with a power in hand. The tool stays armed after
// use, so the bubble's click either answers the prayer with that power, when it is the one the
// prayer asks for, or picks up the right power (App's onPrayerClick).
import { prayerTool } from '../game/model/prayers'

/** How far from the prayer a power still answers it (ANSWER_RADIUS in sim/civ/divine/prayers.rs). */
const ANSWER_REACH = 22
/** Neighbours counted around a person: about the reach of a point power. */
const CROWD_REACH = 4

interface Person {
  alive: boolean
  x: number
  y: number
  lineage_id?: string
}

/**
 * Where to drop the armed power to answer the prayer, or null when the click should pick a power
 * up instead. The prayer stands at the middle of its tribe, where there may be nobody (a power
 * like love or healing then finds no one), so the power lands on the most crowded of the tribe's
 * people within reach.
 */
export function answerPrayerOnSpot(
  prayer: { kind: string; x: number; y: number; lineage_id?: string },
  armedToolId: string | null | undefined,
  people: readonly Person[] = [],
): { worldX: number; worldY: number } | null {
  if (!armedToolId || armedToolId !== prayerTool(prayer.kind)) return null
  const tribe = people.filter(
    (p) =>
      p.alive &&
      p.lineage_id === prayer.lineage_id &&
      Math.hypot(p.x - prayer.x, p.y - prayer.y) <= ANSWER_REACH - CROWD_REACH,
  )
  let best: Person | null = null
  let bestCrowd = -1
  for (const p of tribe) {
    let crowd = 0
    for (const q of tribe) if (Math.hypot(q.x - p.x, q.y - p.y) <= CROWD_REACH) crowd += 1
    if (crowd > bestCrowd) {
      best = p
      bestCrowd = crowd
    }
  }
  // People are drawn at the middle of their tile, as a click on them lands.
  return best
    ? { worldX: best.x + 0.5, worldY: best.y + 0.5 }
    : { worldX: prayer.x + 0.5, worldY: prayer.y + 0.5 }
}
