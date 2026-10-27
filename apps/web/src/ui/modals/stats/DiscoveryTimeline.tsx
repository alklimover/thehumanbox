import type { WorldState } from '../../../shared/types'
import { eventDate } from '../../event-date'
import { t } from '../../../i18n'
import { simActor, simText } from '../../../fork/i18n/simtext'

export function DiscoveryTimeline({ events }: { events: WorldState['events'] }) {
  const milestones = events
    .filter(
      (e) =>
        e.type === 'build' &&
        (e.detail.includes('mastered') ||
          e.detail.includes('discovered') ||
          e.detail.includes('planted a farm')),
    )
    .slice(-20)

  if (milestones.length === 0) {
    return (
      <div style={{ color: '#333', fontSize: 11, padding: '8px 0' }}>{t('dialogs.stats.noDiscoveries')}</div>
    )
  }

  return (
    <div className="stats-timeline">
      {milestones.map((e, i) => (
        <div key={i} className="stats-timeline-row">
          <span className="stats-tick">{eventDate(e.tick)}</span>
          <span className="stats-actor">{simActor(e.actor)}</span>
          <span className="stats-detail">{simText('event', e.detail)}</span>
        </div>
      ))}
    </div>
  )
}
