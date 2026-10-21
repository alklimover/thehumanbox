import { useState, useEffect } from 'react'
import type { OrgLife, LifeEvent } from '../../shared/types'
import { Modal } from './Modal'
import { API_BASE } from '../../shared/config'
import { useSimulationData } from '../../simulation/simulationData'
import { t, tn, type MessageKey } from '../../i18n'
import { simLabel } from '../../i18n/sim'
import { sexLabel } from './words'

const DAY_LENGTH = 600

const CATEGORY_ICON: Record<string, string> = {
  love: '❤️',
  loss: '💔',
  birth: '🌱',
  friendship: '🤝',
  discovery: '🔍',
  achievement: '⭐',
  trauma: '⚡',
  witnessed: '👁',
  aspiration: '✦',
  partnership: '💞',
  courtship: '💛',
  farewell: '🕯️',
  danger: '⚠',
  specialty: '🛠',
  graduated: '🎓',
  religion: '🕯️',
  milestone: '🏁',
  elder: '◈',
  death: '⚰',
  betrayal: '🗡️',
  event: '•',
}

const CATEGORY_LABEL: Record<string, MessageKey> = {
  love: 'life.category.love',
  loss: 'life.category.loss',
  birth: 'life.category.birth',
  friendship: 'life.category.friendship',
  discovery: 'life.category.discovery',
  achievement: 'life.category.achievement',
  trauma: 'life.category.trauma',
  witnessed: 'life.category.witnessed',
  aspiration: 'life.category.aspiration',
  partnership: 'life.category.partnership',
  courtship: 'life.category.courtship',
  farewell: 'life.category.farewell',
  danger: 'life.category.danger',
  specialty: 'life.category.specialty',
  graduated: 'life.category.graduated',
  religion: 'life.category.religion',
  milestone: 'life.category.milestone',
  elder: 'life.category.elder',
  death: 'life.category.death',
  betrayal: 'life.category.betrayal',
  event: 'life.category.event',
}

/** The name of a life-event category; one the client does not know shows as the simulation sends it. */
function categoryLabel(category: string): string {
  const key = CATEGORY_LABEL[category]
  return key ? t(key) : category
}

// The life summary's emotional state (OrgLife::emotional_state in sim-core's organism/json.rs). These
// are not the person's mood ids, so they have their own words; anything else goes through the mood table.
const FEELING_LABEL: Record<string, MessageKey> = {
  devastated: 'life.state.devastated',
  grieving: 'life.state.grieving',
  'desperately lonely': 'life.state.desperatelyLonely',
  terrified: 'life.state.terrified',
  lonely: 'life.state.lonely',
  content: 'life.state.content',
  restless: 'life.state.restless',
  starving: 'life.state.starving',
  stable: 'life.state.stable',
}

const MEMORY_KIND_LABEL: Record<string, MessageKey> = {
  core: 'life.memory.core',
  episode: 'life.memory.episode',
  fact: 'life.memory.fact',
  bond: 'life.memory.bond',
  place: 'life.memory.place',
  dream: 'life.memory.dream',
}

const CATEGORY_COLOR: Record<string, string> = {
  love: '#ff88aa',
  loss: '#9966cc',
  birth: '#55dd88',
  friendship: '#ffcc44',
  discovery: '#88ccff',
  achievement: '#ffaa33',
  trauma: '#ff6644',
  witnessed: '#bfa9d6',
  aspiration: '#f6d062',
  partnership: '#ff88aa',
  courtship: '#d4a843',
  farewell: '#778',
  danger: '#ff6644',
  specialty: '#88ccff',
  graduated: '#88ccff',
  religion: '#f6d062',
  milestone: '#ffaa33',
  elder: '#ffcf6a',
  death: '#888',
  betrayal: '#e85040',
  event: '#888',
}

function EventRow({ ev }: { ev: LifeEvent }) {
  const icon = CATEGORY_ICON[ev.category] ?? '•'
  const color = CATEGORY_COLOR[ev.category] ?? '#888'
  const day = ev.tick > 0 ? t('life.day', { n: Math.floor(ev.tick / DAY_LENGTH) }) : ''
  return (
    <div
      className="life-event-row"
      style={{ borderLeft: `2px solid ${color}`, paddingLeft: 8, marginBottom: 6 }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ color, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          {categoryLabel(ev.category)}
        </span>
        {day && <span style={{ color: '#555', fontSize: 8, marginLeft: 'auto' }}>{day}</span>}
      </div>
      <div style={{ color: '#ccc', fontSize: 10, marginTop: 2, lineHeight: 1.4 }}>{ev.text}</div>
      {ev.related_name && ev.category !== 'event' && (
        <div style={{ color: '#666', fontSize: 9, marginTop: 1 }}>↳ {ev.related_name}</div>
      )}
    </div>
  )
}

interface Props {
  orgId: string
  orgName: string
  onClose: () => void
}

export function LifeModal({ orgId, orgName, onClose }: Props) {
  const { apiEnabled, loadLocalOrgLife } = useSimulationData()
  const [life, setLife] = useState<OrgLife | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setLife(null)
    // Abort the in-flight fetch when the modal unmounts or orgId
    // changes, so the late .then doesn't flip stale state onto the
    // next-opened modal.
    const ctrl = new AbortController()
    let cancelled = false
    const request = apiEnabled
      ? fetch(`${API_BASE}/org/${orgId}/life`, { signal: ctrl.signal }).then((r) => {
          if (!r.ok) throw new Error()
          return r.json() as Promise<OrgLife>
        })
      : loadLocalOrgLife(orgId).then((localLife) => {
          if (!localLife) throw new Error()
          return localLife
        })
    request
      .then((result) => {
        if (cancelled) return
        setLife(result)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [apiEnabled, loadLocalOrgLife, orgId])

  const ageInDays = life ? Math.floor(life.age_ticks / DAY_LENGTH) : 0

  const categories = life ? [...new Set(life.events.map((e) => e.category))].filter((c) => c !== 'event') : []

  const recent = life ? life.events.slice(-10) : []
  const stuckCount = recent.length >= 6 && recent.every((e) => e.text === recent[0].text) ? recent.length : 0

  return (
    <Modal
      open
      onClose={onClose}
      className="lang-modal life-modal"
      title={t('life.title', { name: orgName })}
      hideTitle
    >
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('life.heading', { name: orgName.toUpperCase() })}</span>
        <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="lang-modal-body">
        {loading && (
          <div className="life-skeleton">
            <div className="life-skel-meta" />
            <div className="life-skel-row" />
            <div className="life-skel-row short" />
            <div className="life-skel-section" />
            <div className="life-skel-event" />
            <div className="life-skel-event" />
            <div className="life-skel-event" />
            <div className="life-skel-event" />
          </div>
        )}
        {error && (
          <div style={{ color: '#ff6644', textAlign: 'center', padding: 20 }}>{t('life.failed')}</div>
        )}
        {life && (
          <>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
                fontSize: 9,
                color: '#888',
              }}
            >
              <span>{t('life.gen', { n: life.generation })}</span>
              <span>·</span>
              <span>{tn('stats.daysOld', ageInDays)}</span>
              <span>·</span>
              <span>{sexLabel(life.sex)}</span>
              {life.is_elder && (
                <>
                  <span>·</span>
                  <span style={{ color: '#ffcc44' }}>{t('life.elder')}</span>
                </>
              )}
              {life.partner_id && (
                <>
                  <span>·</span>
                  <span style={{ color: '#ff88aa' }}>{t('life.partnered')}</span>
                </>
              )}
              {life.children_count > 0 && (
                <>
                  <span>·</span>
                  <span>{tn('life.children', life.children_count)}</span>
                </>
              )}
            </div>

            <div
              className="life-emotional-state"
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 4,
                padding: '6px 10px',
                marginBottom: 12,
                fontSize: 10,
                color: '#aaa',
              }}
            >
              <span style={{ color: '#888', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('life.feeling')}
              </span>
              <span style={{ marginLeft: 8, color: '#ddd' }}>
                {FEELING_LABEL[life.emotional_state]
                  ? t(FEELING_LABEL[life.emotional_state])
                  : simLabel('mood', life.emotional_state)}
              </span>
            </div>

            {life.friends.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 8,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {t('life.friends')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {life.friends.map((f) => (
                    <span
                      key={f}
                      style={{
                        background: '#2a2200',
                        border: '1px solid #ffcc44',
                        borderRadius: 3,
                        padding: '2px 6px',
                        fontSize: 9,
                        color: '#ffcc44',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {life.discoveries.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 8,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {t('life.discoveries')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {life.discoveries.map((d) => (
                    <span
                      key={d}
                      style={{
                        background: '#001a2a',
                        border: '1px solid #88ccff',
                        borderRadius: 3,
                        padding: '2px 6px',
                        fontSize: 9,
                        color: '#88ccff',
                      }}
                    >
                      {simLabel('discovery', d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {categories.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 8,
                      color: CATEGORY_COLOR[c] ?? '#888',
                      border: `1px solid ${CATEGORY_COLOR[c] ?? '#888'}`,
                      borderRadius: 3,
                      padding: '1px 5px',
                    }}
                  >
                    {CATEGORY_ICON[c]} {categoryLabel(c)}
                  </span>
                ))}
              </div>
            )}

            {life.memories && life.memories.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 8,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 6,
                    marginTop: 4,
                  }}
                >
                  {t('life.memories', { n: life.memories.length })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                  {life.memories.slice(0, 8).map((m, i) => {
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
                              : '#cccccc'
                    return (
                      <div
                        key={`mem-${i}`}
                        style={{ display: 'flex', gap: 6, fontSize: 10, alignItems: 'flex-start' }}
                      >
                        <span
                          style={{
                            color: kindColor[m.kind] ?? '#999',
                            minWidth: 48,
                            fontWeight: 600,
                            fontSize: 9,
                          }}
                        >
                          {MEMORY_KIND_LABEL[m.kind] ? t(MEMORY_KIND_LABEL[m.kind]) : m.kind}
                        </span>
                        <span style={{ color: emoColor, lineHeight: 1.4 }}>{m.text}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div
              style={{
                fontSize: 8,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {t('life.events', { n: life.events.length })}
            </div>

            {stuckCount > 0 && <div className="life-stuck-banner">{tn('life.stuck', stuckCount)}</div>}

            {life.events.length === 0 ? (
              <div style={{ color: '#555', fontSize: 10, textAlign: 'center', padding: 12 }}>
                {t('life.noEvents')}
              </div>
            ) : (
              <div className={life.events.length > 8 ? 'life-events-grid' : ''}>
                {[...life.events].reverse().map((ev, i) => (
                  <EventRow key={i} ev={ev} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
