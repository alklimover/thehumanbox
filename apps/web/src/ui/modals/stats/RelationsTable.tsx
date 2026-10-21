import { useMemo } from 'react'
import type { TribalRelation } from '../../../shared/types'
import { lineageColor } from '../../../shared/constants'
import { t, type MessageKey } from '../../../i18n'
import { displayName } from '../../../i18n/names'

const STATUS_KEYS: Record<TribalRelation['status'], MessageKey> = {
  ally: 'stats.relation.ally',
  neutral: 'stats.relation.neutral',
  rivals: 'stats.relation.rivals',
}

export function RelationsTable({
  relations,
  lineageSizes,
  lineageNames = {},
}: {
  relations: TribalRelation[]
  lineageSizes: { id: string; count: number }[]
  lineageNames?: Record<string, string>
}) {
  const sizeMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const { id, count } of lineageSizes) m[id] = count
    return m
  }, [lineageSizes])

  const sorted = [...relations].sort((a, b) => Math.abs(b.attitude) - Math.abs(a.attitude))

  if (sorted.length === 0) {
    return <div className="stats-rel-empty">{t('stats.noRelations')}</div>
  }

  return (
    <div className="stats-relations">
      {sorted.slice(0, 12).map((r, i) => {
        const barW = Math.abs(r.attitude) * 80
        const barColor = r.attitude > 0.3 ? '#8fd06a' : r.attitude < -0.3 ? '#d8463a' : 'var(--px-muted)'
        return (
          <div key={i} className="stats-rel-row">
            <span className="stats-rel-name" style={{ color: lineageColor(r.a) }}>
              {displayName(lineageNames[r.a]) || r.a}
            </span>
            <span className="stats-rel-muted">↔</span>
            <span className="stats-rel-name" style={{ color: lineageColor(r.b) }}>
              {displayName(lineageNames[r.b]) || r.b}
            </span>
            <div className="stats-rel-bar-wrap">
              <div className="stats-rel-bar" style={{ width: barW, background: barColor }} />
            </div>
            <span className={`stats-rel-status status-${r.status}`}>
              {STATUS_KEYS[r.status] ? t(STATUS_KEYS[r.status]) : r.status}
            </span>
            <span className="stats-rel-muted">
              {t('stats.relation.sizes', { a: sizeMap[r.a] ?? '?', b: sizeMap[r.b] ?? '?' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
