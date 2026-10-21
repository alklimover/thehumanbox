import { useMemo } from 'react'
import { calendarAt } from '../../../game/model/calendar'
import { legendsOf } from '../../../game/model/legends'
import { t, type MessageKey } from '../../../i18n'
import type { SimEvent } from '../../../shared/types'
import { simText } from '../../../i18n/simtext'

// Legend titles by event type; legendsOf titles the same types in English.
const TITLE_KEYS: Record<string, MessageKey> = {
  meteor: 'stats.legend.meteor',
  eruption: 'stats.legend.eruption',
  battle: 'stats.legend.battle',
  war_declared: 'stats.legend.war_declared',
  treaty: 'stats.legend.treaty',
  era: 'stats.legend.era',
  era_advance: 'stats.legend.era_advance',
  milestone: 'stats.legend.milestone',
  smite: 'stats.legend.smite',
  answered: 'stats.legend.answered',
  forsaken: 'stats.legend.forsaken',
  prayer: 'stats.legend.prayer',
  outbreak: 'stats.legend.outbreak',
  disease_death: 'stats.legend.disease_death',
  building_ruined: 'stats.legend.building_ruined',
  weather: 'stats.legend.weather',
  drought: 'stats.legend.drought',
  danger: 'stats.legend.danger',
}

/** The world's latest notable events, told as titled legends with their date. */
export function LegendsList({ events }: { events: SimEvent[] }) {
  const legends = useMemo(() => {
    // A legend keeps its event's tick and detail but not its type, which picks the title.
    const typeOf = new Map(events.map((e) => [`${e.tick}|${e.detail}`, e.type]))
    return legendsOf(events).map((l) => {
      const key = TITLE_KEYS[typeOf.get(`${l.tick}|${l.text}`) ?? '']
      const date = calendarAt(l.tick)
      return {
        ...l,
        title: key ? t(key) : l.title,
        when: t('calendar.yearSeason', { year: date.year, season: date.season }),
      }
    })
  }, [events])
  if (legends.length === 0) {
    return (
      <div style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
        {t('stats.noLegends')}
      </div>
    )
  }
  return (
    <ul className="legends-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {legends.map((l) => (
        <li key={`${l.tick}-${l.title}-${l.text}`} style={{ fontSize: 11, padding: '3px 0' }}>
          <span style={{ color: '#e8c46a' }}>{l.title}</span>
          <span style={{ color: '#777' }}> · {l.when}</span>
          <div style={{ color: '#bbb' }}>{simText('event', l.text)}</div>
        </li>
      ))}
    </ul>
  )
}
