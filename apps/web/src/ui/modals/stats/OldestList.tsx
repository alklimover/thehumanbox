import { useMemo } from 'react'
import { oldestLiving } from '../../../game/model/oldest-living'
import { t, tn } from '../../../i18n'
import type { OrganismState } from '../../../shared/types'

/** The five oldest living people in the world, with their tribe and age in days. */
export function OldestList({
  organisms,
  lineageNames,
}: {
  organisms: OrganismState[]
  lineageNames?: Record<string, string>
}) {
  const rows = useMemo(() => oldestLiving(organisms), [organisms])
  if (rows.length === 0) {
    return (
      <div style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
        {t('stats.nobodyAlive')}
      </div>
    )
  }
  return (
    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, lineHeight: 1.6 }}>
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`}>
          <span style={{ color: '#e8c46a' }}>{r.name}</span>
          <span style={{ color: '#777' }}>
            {' '}
            · {lineageNames?.[r.lineage_id] ?? r.lineage_id.slice(0, 6)} · {tn('stats.daysOld', r.days)}
          </span>
        </li>
      ))}
    </ol>
  )
}
