import { calendarAt } from '../../game/model/calendar'
import { DIFFICULTY_ORDER, goalFraction, goalsSummary } from '../../game/model/goals'
import { t, type MessageKey } from '../../i18n'
import type { Difficulty, GoalStatus, WorldState } from '../../shared/types'
import { sendSandboxCommand } from '../../simulation/commandBus'
import { Modal } from './Modal'

const DIFFICULTY: Record<Difficulty, { label: MessageKey; note: MessageKey }> = {
  calm: { label: 'goals.difficulty.calm', note: 'goals.difficulty.calm.note' },
  normal: { label: 'goals.difficulty.normal', note: 'goals.difficulty.normal.note' },
  harsh: { label: 'goals.difficulty.harsh', note: 'goals.difficulty.harsh.note' },
}

/** How many goals are met, or the day the world was lost. */
function headline(done: number, total: number, lostTick: number | null | undefined): string {
  if (lostTick != null) {
    const date = calendarAt(lostTick)
    return t('goals.lostOn', { year: date.year, season: date.season, day: date.dayOfSeason })
  }
  return total === 0 ? t('goals.none') : t('goals.met', { done, total })
}

/** The goal's progress as words: "3 of 5", "not yet", "met". */
function progressText(goal: GoalStatus): string {
  if (goal.done) return t('goals.progress.met')
  if (goal.target === 1) return t('goals.progress.notYet')
  return t('goals.progress.count', { progress: goal.progress, target: goal.target })
}

interface Props {
  world: WorldState
  onClose: () => void
}

/** The player's goals, the world's difficulty and whether the world is lost. Sits beside the achievements. */
export function GoalsModal({ world, onClose }: Props) {
  const goals = world.goals ?? []
  const difficulty: Difficulty = world.difficulty ?? 'normal'
  const summary = goalsSummary(goals, world.lost_tick)

  return (
    <Modal
      open
      onClose={onClose}
      className="achievements-modal goals-modal"
      title={t('goals.title')}
      hideTitle
    >
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('goals.heading')}</span>
        <span className="tree-modal-sub">{headline(summary.done, summary.total, world.lost_tick)}</span>
      </div>

      {summary.lost && (
        <p role="status" data-testid="goals-lost" style={{ color: '#e07060', margin: '10px 0 0' }}>
          {t('goals.lost')}
        </p>
      )}

      <ul className="goal-list" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
        {goals.map((g) => (
          <li
            key={g.id}
            data-done={g.done}
            style={{ padding: '8px 0', borderBottom: '1px solid #3a3020', opacity: g.done ? 1 : 0.85 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: g.done ? '#e8b060' : '#f4e6c0' }}>
                {g.done ? '★ ' : '☆ '}
                {g.title}
              </span>
              <span className="tree-modal-sub">{progressText(g)}</span>
            </div>
            <div
              aria-hidden="true"
              style={{ height: 4, marginTop: 6, background: '#3a3020', borderRadius: 2, overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${Math.round(goalFraction(g) * 100)}%`,
                  height: '100%',
                  background: g.done ? '#e8b060' : '#a08040',
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 14 }}>
        <div className="tree-modal-sub" style={{ marginBottom: 6 }}>
          {t('goals.difficulty', { note: t(DIFFICULTY[difficulty].note) })}
        </div>
        <div role="group" aria-label={t('goals.difficulty.aria')} style={{ display: 'flex', gap: 6 }}>
          {DIFFICULTY_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              className="lang-btn"
              aria-pressed={level === difficulty}
              onClick={() => {
                void sendSandboxCommand({ cmd: 'set_difficulty', level })
              }}
            >
              {t(DIFFICULTY[level].label)}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
