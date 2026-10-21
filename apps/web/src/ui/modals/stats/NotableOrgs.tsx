import { t, tn } from '../../../i18n'
import { personName } from '../../../shared/personName'
import type { WorldState } from '../../../shared/types'
import { lineageColor } from '../../../shared/constants'
import { DAY_LENGTH } from './constants'

export function NotableOrgs({ organisms }: { organisms: WorldState['organisms'] }) {
  if (organisms.length === 0) return null
  const byAge = [...organisms].sort((a, b) => b.age - a.age).slice(0, 3)
  const byKids = [...organisms].sort((a, b) => (b.children_count ?? 0) - (a.children_count ?? 0)).slice(0, 3)
  const byGen = [...organisms].sort((a, b) => b.generation - a.generation).slice(0, 3)
  const row = (
    label: string,
    list: WorldState['organisms'],
    pick: (o: WorldState['organisms'][number]) => string,
  ) => (
    <div className="notable-row" key={label}>
      <span className="notable-label">{label}</span>
      <span className="notable-list">
        {list.map((o) => (
          <span key={o.id} className="notable-entry" style={{ color: lineageColor(o.lineage_id) }}>
            {personName(o)} <span style={{ color: '#666' }}>{pick(o)}</span>
          </span>
        ))}
      </span>
    </div>
  )
  return (
    <div className="notable-grid">
      {row(t('stats.notable.oldest'), byAge, (o) => tn('stats.notable.days', Math.floor(o.age / DAY_LENGTH)))}
      {row(t('stats.notable.parents'), byKids, (o) => tn('stats.notable.kids', o.children_count ?? 0))}
      {row(t('stats.notable.deepest'), byGen, (o) => t('stats.notable.gen', { n: o.generation }))}
    </div>
  )
}
