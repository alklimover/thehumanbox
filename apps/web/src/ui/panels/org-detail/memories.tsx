import { lineageColor } from '../../../shared/constants'
import type { OrganismState, OrgDetail } from '../../../shared/types'
import { t, tn, type MessageKey } from '../../../i18n'
import { sexByName, sexOf, simText } from '../../../i18n/simtext'
import { displayName } from '../../../i18n/names'

/** The word for each kind of memory the simulation keeps. */
const MEMORY_KIND: Record<string, MessageKey> = {
  core: 'person.memoryKind.core',
  episode: 'person.memoryKind.episode',
  fact: 'person.memoryKind.fact',
  bond: 'person.memoryKind.bond',
  place: 'person.memoryKind.place',
  dream: 'person.memoryKind.dream',
}

const kindName = (kind: string) => (MEMORY_KIND[kind] ? t(MEMORY_KIND[kind]) : kind)

export function BondsRememberedSection({
  detail,
  organisms,
  onSelectOrg,
}: {
  detail: OrgDetail | null
  organisms?: OrganismState[]
  onSelectOrg?: (id: string) => void
}) {
  return (
    <>
      {detail?.memories && detail.memories.filter((m) => m.kind === 'bond').length > 0 && (
        <>
          <div className="org-detail-section">{t('person.bonds.title')}</div>
          <div className="thought-history">
            {detail.memories
              .filter((m) => m.kind === 'bond')
              .slice(0, 8)
              .map((m, i) => {
                const relatedOrg = m.related_id ? organisms?.find((o) => o.id === m.related_id) : null
                const emo = m.emotion >= 1 ? '#f6c46a' : m.emotion <= -1 ? '#6090c0' : '#d0c8c0'
                return (
                  <div key={`bond-${i}`} className="thought-row" style={{ alignItems: 'flex-start' }}>
                    <span
                      className="thought-tick"
                      style={{ color: '#e09ab0', fontWeight: 600, minWidth: 50 }}
                    >
                      {t('person.bonds.bond')}
                    </span>
                    <span className="thought-text" style={{ color: emo, flex: 1 }}>
                      {simText('memory', m.text, { sex: sexOf(detail), sexOf: sexByName(organisms) })}
                      {relatedOrg && (
                        <button
                          onClick={() => onSelectOrg?.(relatedOrg.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #2a2520',
                            color: lineageColor(relatedOrg.lineage_id),
                            fontSize: 9,
                            padding: '1px 5px',
                            marginLeft: 6,
                            borderRadius: 3,
                            cursor: 'pointer',
                          }}
                        >
                          ↪ {displayName(relatedOrg.name)}
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
          </div>
        </>
      )}
    </>
  )
}

export function MemoriesSection({
  detail,
  organisms,
  onSelectOrg,
}: {
  detail: OrgDetail | null
  organisms?: OrganismState[]
  onSelectOrg?: (id: string) => void
}) {
  return (
    <>
      {detail?.memories && detail.memories.length > 0 && (
        <>
          <div className="org-detail-section">{t('person.memories.title')}</div>
          <div className="thought-history">
            {detail.memories.map((m, i) => {
              const kindColor: Record<string, string> = {
                core: '#d8c060',
                episode: '#bfa9d6',
                fact: '#90c8b0',
                bond: '#e09ab0',
                place: '#a8c0e0',
                dream: '#888',
              }
              const emoColor =
                m.emotion >= 2
                  ? '#f6c46a'
                  : m.emotion >= 1
                    ? '#d8c060'
                    : m.emotion <= -2
                      ? '#6090c0'
                      : m.emotion <= -1
                        ? '#80a8c0'
                        : '#d0c8c0'
              const bars = Math.max(1, Math.round(m.salience * 5))
              const relatedOrg = m.related_id ? organisms?.find((o) => o.id === m.related_id) : null
              return (
                <div key={i} className="thought-row" style={{ alignItems: 'flex-start' }}>
                  <span
                    className="thought-tick"
                    style={{
                      color: kindColor[m.kind] ?? '#999',
                      fontWeight: 600,
                      minWidth: 56,
                    }}
                    title={
                      t('person.memories.kindTip', {
                        kind: kindName(m.kind),
                        pct: (m.salience * 100).toFixed(0),
                      }) + (m.recalls > 0 ? tn('person.memories.recalled', m.recalls) : '')
                    }
                  >
                    {kindName(m.kind)}
                  </span>
                  <span className="thought-text" style={{ color: emoColor, flex: 1 }}>
                    {simText('memory', m.text, { sex: sexOf(detail), sexOf: sexByName(organisms) })}
                    {relatedOrg && (
                      <button
                        onClick={() => onSelectOrg?.(relatedOrg.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #2a2520',
                          color: '#9ad0f0',
                          fontSize: 9,
                          padding: '1px 5px',
                          marginLeft: 6,
                          borderRadius: 3,
                          cursor: 'pointer',
                        }}
                        title={t('person.memories.goTo', { name: displayName(relatedOrg.name) })}
                      >
                        ↪ {displayName(relatedOrg.name)}
                      </button>
                    )}
                  </span>
                  <span
                    style={{ color: '#444', fontFamily: 'monospace', fontSize: 9, marginLeft: 6 }}
                    title={t('person.memories.salience', { pct: (m.salience * 100).toFixed(0) })}
                  >
                    {'▮'.repeat(bars)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
