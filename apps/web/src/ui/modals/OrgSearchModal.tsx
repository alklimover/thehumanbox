import { personName } from '../../shared/personName'
import { useState, useMemo, useRef, useEffect } from 'react'
import clsx from 'clsx'
import type { OrganismState } from '../../shared/types'
import { lineageColor, cbColor } from '../../shared/constants'
import { OrgDetail } from '../panels/OrgDetail'
import { Modal } from './Modal'
import { t } from '../../i18n'
import { simLabel } from '../../i18n/sim'

const DAY_LENGTH = 600

interface Props {
  organisms: OrganismState[]
  onTrack?: (id: string) => void
  onClose: () => void
  lineageNames?: Record<string, string>
}

type StatusFilter = 'all' | 'alive' | 'dead'
type DiscoveryFilter = 'all' | 'fire' | 'shelter'
type AspirationFilter =
  | 'all'
  | 'seeker'
  | 'wanderer'
  | 'warrior'
  | 'connector'
  | 'builder'
  | 'devout'
  | 'sage'
  | 'provider'
  | 'artist'
  | 'healer'

const ASPIRATION_EMOJI: Record<string, string> = {
  seeker: '🔍',
  wanderer: '🧭',
  warrior: '⚔️',
  connector: '🤝',
  builder: '🔨',
  devout: '🕯️',
  sage: '📜',
  provider: '🌾',
  artist: '🎨',
  healer: '🌿',
}

export function OrgSearchModal({ organisms, onTrack, onClose, lineageNames }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [lineageF, setLineageF] = useState('all')
  const [discF, setDiscF] = useState<DiscoveryFilter>('all')
  const [aspirationF, setAspirationF] = useState<AspirationFilter>('all')
  const [sexF, setSexF] = useState<'all' | 'male' | 'female'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tribeOpen, setTribeOpen] = useState(false)
  const tribeRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Set by the back button: the list is hidden while a person is open, so its scroll is reset once it shows again.
  const returningToList = useRef(false)
  // Focusing the search box on a touch screen raises the keyboard over the list before anyone asked for it.
  const [autoFocus] = useState(() => !window.matchMedia?.('(pointer: coarse)').matches)

  useEffect(() => {
    if (!returningToList.current || !listRef.current) return
    returningToList.current = false
    listRef.current.scrollTop = 0
  }, [selectedId])

  useEffect(() => {
    if (!tribeOpen) return
    // pointerdown, not mousedown, so a touch tap dismisses the same way a mouse click does.
    const handler = (e: PointerEvent) => {
      if (tribeRef.current && !tribeRef.current.contains(e.target as Node)) setTribeOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [tribeOpen])

  const tribeName = (lid: string) => lineageNames?.[lid] ?? (lid ?? '').slice(0, 6)
  const currentTribeLabel = lineageF === 'all' ? t('search.allTribes') : tribeName(lineageF)

  const lineages = useMemo(() => [...new Set(organisms.map((o) => o.lineage_id))].sort(), [organisms])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return organisms
      .filter((o) => {
        if (status === 'alive' && !o.alive) return false
        if (status === 'dead' && o.alive) return false
        if (lineageF !== 'all' && o.lineage_id !== lineageF) return false
        if (discF === 'fire' && !(o.discoveries ?? []).includes('fire')) return false
        if (discF === 'shelter' && !(o.discoveries ?? []).includes('shelter')) return false
        if (aspirationF !== 'all' && o.aspiration !== aspirationF) return false
        if (sexF !== 'all' && o.sex !== sexF) return false
        // `name` and `lineage_id` are cold fields and are genuinely absent
        // for an organism whose cache entry was seeded from a cold-less
        // frame, so the search box threw a TypeError on the first
        // keystroke.
        if (
          q &&
          !(o.name ?? '').toLowerCase().includes(q) &&
          !(o.thought ?? '').toLowerCase().includes(q) &&
          !(o.lineage_id ?? '').toLowerCase().includes(q)
        )
          return false
        return true
      })
      .sort((a, b) => {
        if (a.alive !== b.alive) return a.alive ? -1 : 1
        return b.age - a.age
      })
  }, [organisms, status, lineageF, discF, aspirationF, sexF, query])

  const selectedOrg = selectedId ? (organisms.find((o) => o.id === selectedId) ?? null) : null

  return (
    <Modal open onClose={onClose} className="org-search-modal" title={t('search.title')} hideTitle>
      {}
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('search.heading')}</span>
        <span className="tree-modal-sub">
          {t('search.sub', {
            shown: filtered.length,
            alive: organisms.filter((o) => o.alive).length,
            dead: organisms.filter((o) => !o.alive).length,
          })}
        </span>
        <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {}
      <div className={clsx('org-search-toolbar', selectedOrg && 'org-search-toolbar--behind-detail')}>
        <input
          className="org-search-input"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
        />
        <div className="org-search-filterbar">
          <div className="org-search-filters">
            {(['all', 'alive', 'dead'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={clsx('filter-chip', status === s && 'active')}
                onClick={() => setStatus(s)}
              >
                {t(`search.status.${s}`)}
              </button>
            ))}
            <span className="filter-sep">·</span>
            <button
              className={clsx('filter-chip', discF === 'fire' && 'active')}
              onClick={() => setDiscF(discF === 'fire' ? 'all' : 'fire')}
            >
              🔥 {simLabel('discovery', 'fire')}
            </button>
            <button
              className={clsx('filter-chip', discF === 'shelter' && 'active')}
              onClick={() => setDiscF(discF === 'shelter' ? 'all' : 'shelter')}
            >
              🏠 {simLabel('discovery', 'shelter')}
            </button>
            <span className="filter-sep">·</span>
            <button
              className={clsx('filter-chip', sexF === 'female' && 'active')}
              onClick={() => setSexF(sexF === 'female' ? 'all' : 'female')}
              style={{ color: sexF === 'female' ? '#e09ab0' : undefined }}
            >
              ♀
            </button>
            <button
              className={clsx('filter-chip', sexF === 'male' && 'active')}
              onClick={() => setSexF(sexF === 'male' ? 'all' : 'male')}
              style={{ color: sexF === 'male' ? '#7ab0e0' : undefined }}
            >
              ♂
            </button>
            <span className="filter-sep">·</span>
            {(
              [
                'seeker',
                'wanderer',
                'warrior',
                'connector',
                'builder',
                'devout',
                'sage',
                'provider',
                'artist',
                'healer',
              ] as AspirationFilter[]
            ).map((a) => (
              <button
                key={a}
                className={clsx('filter-chip', aspirationF === a && 'active')}
                onClick={() => setAspirationF(aspirationF === a ? 'all' : a)}
                title={simLabel('aspiration', a)}
              >
                {ASPIRATION_EMOJI[a]}
              </button>
            ))}
            <span className="filter-sep">·</span>
          </div>
          <div className="tribe-dropdown" ref={tribeRef}>
            <button
              className={clsx('filter-chip', 'tribe-dropdown-btn', lineageF !== 'all' && 'active')}
              onClick={() => setTribeOpen((o) => !o)}
            >
              {lineageF !== 'all' && (
                <span className="tribe-dot" style={{ background: lineageColor(lineageF) }} />
              )}
              {currentTribeLabel} ▾
            </button>
            {tribeOpen && (
              <div className="tribe-dropdown-menu">
                <div
                  className={clsx('tribe-dropdown-item', lineageF === 'all' && 'active')}
                  onClick={() => {
                    setLineageF('all')
                    setTribeOpen(false)
                  }}
                >
                  {t('search.allTribes')}
                </div>
                {lineages.map((lid) => (
                  <div
                    key={lid}
                    className={clsx('tribe-dropdown-item', lineageF === lid && 'active')}
                    onClick={() => {
                      setLineageF(lid)
                      setTribeOpen(false)
                    }}
                  >
                    <span className="tribe-dot" style={{ background: lineageColor(lid) }} />
                    {tribeName(lid)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className={clsx('org-search-body', selectedOrg && 'has-selection')}>
        <div className="org-search-list" ref={listRef}>
          {filtered.length === 0 && <div className="org-search-empty">{t('search.empty')}</div>}
          {filtered.map((org) => {
            const color = lineageColor(org.lineage_id)
            const isSelected = org.id === selectedId
            const discs = org.discoveries ?? []
            return (
              <div
                key={org.id}
                className={clsx('org-search-entry', !org.alive && 'dead', isSelected && 'selected')}
                style={{ borderLeft: `3px solid ${org.alive ? color : '#3a3a3a'}` }}
                onClick={() => setSelectedId(isSelected ? null : org.id)}
              >
                <div className="org-search-entry-top">
                  <span className="org-search-name" style={{ color: org.alive ? '#eee' : '#888' }}>
                    {!org.alive && <span style={{ color: '#555', marginRight: 4 }}>✝</span>}
                    {personName(org)}
                  </span>
                  <span className="org-search-badges">
                    {org.aspiration && ASPIRATION_EMOJI[org.aspiration] && (
                      <span title={simLabel('aspiration', org.aspiration)} style={{ marginRight: 2 }}>
                        {ASPIRATION_EMOJI[org.aspiration]}
                      </span>
                    )}
                    {discs.includes('fire') && '🔥'}
                    {discs.includes('shelter') && '🏠'}
                    {discs.includes('cooking') && '🍖'}
                    {discs.includes('spear') && '🗡️'}
                  </span>
                  <span className="org-search-meta" style={{ color: 'var(--dialog-muted)' }}>
                    {t('search.meta', { gen: org.generation, days: Math.floor(org.age / DAY_LENGTH) })}
                  </span>
                  {org.alive && onTrack && (
                    <button
                      className="org-action-btn org-track-btn"
                      title={t('search.track')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTrack(org.id)
                      }}
                      style={{ marginLeft: 4 }}
                    >
                      ⊕
                    </button>
                  )}
                </div>

                {org.alive ? (
                  <>
                    <div className="org-search-thought">{org.thought}</div>
                    <div className="org-search-bars">
                      <div
                        className="org-mini-bar"
                        style={{ width: `${org.energy * 100}%`, background: cbColor('#55dd55') }}
                      />
                      <div
                        className="org-mini-bar"
                        style={{ width: `${org.hydration * 100}%`, background: '#4499ff' }}
                      />
                      <div
                        className="org-mini-bar"
                        style={{ width: `${org.health * 100}%`, background: cbColor('#ff6644') }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="org-search-memorial">
                    {discs.length > 0 && (
                      <div className="org-memorial-discs">
                        {discs
                          .filter((d) => !d.startsWith('pact:'))
                          .map((d) => (
                            <span key={d} className="org-memorial-disc">
                              {simLabel('discovery', d)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="org-search-detail">
          {selectedOrg ? (
            <>
              <button
                className="org-search-back"
                onClick={() => {
                  returningToList.current = true
                  setSelectedId(null)
                }}
              >
                {t('search.back')}
              </button>
              <OrgDetail
                org={selectedOrg}
                onClose={() => setSelectedId(null)}
                onFollow={() => {}}
                following={false}
                lineageNames={lineageNames}
                organisms={organisms}
                onSelectOrg={(id) => setSelectedId(id)}
              />
            </>
          ) : (
            <div className="org-search-placeholder">{t('search.placeholderDetail')}</div>
          )}
        </div>
      </div>
    </Modal>
  )
}
