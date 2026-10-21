import { useMemo } from 'react'
import { achievementsFor, type Achievement } from '../../game/model/achievements'
import { t, type MessageKey } from '../../i18n'
import type { WorldState } from '../../shared/types'
import { Modal } from './Modal'

// Titles and details by achievement id; achievementsFor words the same ids in English.
const TEXT: Record<string, { title: MessageKey; detail: MessageKey }> = {
  'full-year': { title: 'achievements.full-year.title', detail: 'achievements.full-year.detail' },
  'hundred-souls': { title: 'achievements.hundred-souls.title', detail: 'achievements.hundred-souls.detail' },
  village: { title: 'achievements.village.title', detail: 'achievements.village.detail' },
  'three-tribes': { title: 'achievements.three-tribes.title', detail: 'achievements.three-tribes.detail' },
  grandchildren: { title: 'achievements.grandchildren.title', detail: 'achievements.grandchildren.detail' },
  ruler: { title: 'achievements.ruler.title', detail: 'achievements.ruler.detail' },
  elder: { title: 'achievements.elder.title', detail: 'achievements.elder.detail' },
  toolmakers: { title: 'achievements.toolmakers.title', detail: 'achievements.toolmakers.detail' },
  'first-road': { title: 'achievements.first-road.title', detail: 'achievements.first-road.detail' },
  'road-network': { title: 'achievements.road-network.title', detail: 'achievements.road-network.detail' },
  'over-the-water': {
    title: 'achievements.over-the-water.title',
    detail: 'achievements.over-the-water.detail',
  },
}

/** An achievement in the player's language. The goal number comes from the English detail it replaces. */
function localized(a: Achievement): Achievement {
  const text = TEXT[a.id]
  const goal = Number(/\d+/.exec(a.detail)?.[0] ?? 0)
  const count = a.progress && /^(\d+) of (\d+)$/.exec(a.progress)
  const year = a.progress && /^(\d+)% of the first year$/.exec(a.progress)
  return {
    ...a,
    title: text ? t(text.title) : a.title,
    detail: text ? t(text.detail, { n: goal }) : a.detail,
    progress: count
      ? t('achievements.progress', { done: Number(count[1]), goal: Number(count[2]) })
      : year
        ? t('achievements.firstYear', { percent: Number(year[1]) })
        : a.progress,
  }
}

interface Props {
  world: WorldState
  onClose: () => void
}

/** What the world has achieved so far. Read live from the world, so nothing here is saved or replayed. */
export function AchievementsModal({ world, onClose }: Props) {
  const list = useMemo(
    () =>
      achievementsFor({
        tick: world.tick,
        organisms: world.organisms,
        settlements: world.settlements,
        grid: world.grid,
      }).map(localized),
    [world.tick, world.organisms, world.settlements, world.grid],
  )
  const earned = list.filter((a) => a.unlocked).length

  return (
    <Modal open onClose={onClose} className="achievements-modal" title={t('achievements.title')} hideTitle>
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('achievements.heading')}</span>
        <span className="tree-modal-sub">{t('achievements.earned', { earned, total: list.length })}</span>
      </div>
      <ul className="achievement-list" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
        {list.map((a) => (
          <li
            key={a.id}
            data-unlocked={a.unlocked}
            style={{
              display: 'flex',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid #3a3020',
              opacity: a.unlocked ? 1 : 0.6,
            }}
          >
            <span aria-hidden="true" style={{ width: 18, color: a.unlocked ? '#e8b060' : '#666' }}>
              {a.unlocked ? '★' : '☆'}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: a.unlocked ? '#f4e6c0' : '#a09070' }}>{a.title}</span>
              <span className="tree-modal-sub">{a.detail}</span>
              {!a.unlocked && a.progress && <span className="tree-modal-sub">{a.progress}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
