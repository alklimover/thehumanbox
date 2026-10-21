import { getLocale } from './locale'
import { t, tn } from '.'

/** A goal as the simulation sends it (GoalStatus in crates/sim-core/src/sim/goals.rs). */
interface GoalLike {
  id: string
  title: string
}

const KEEP_TRIBES = /^Keep (\d+) tribes alive for (\d+) years$/

/**
 * The goal's title in the player's language. The simulation writes it in
 * English; the Russian one is picked by the goal's id, with the numbers taken
 * from the English title. An unknown goal keeps its English title.
 */
export function goalTitle(goal: GoalLike): string {
  if (getLocale() === 'en') return goal.title
  if (goal.id === 'reach_iron_age') return t('goals.goal.ironAge')
  const keep = goal.id === 'keep_three_tribes' ? KEEP_TRIBES.exec(goal.title) : null
  if (keep) {
    return t('goals.goal.keepTribes', {
      tribes: tn('goals.goal.tribes', Number(keep[1])),
      years: tn('goals.goal.years', Number(keep[2])),
    })
  }
  return goal.title
}
