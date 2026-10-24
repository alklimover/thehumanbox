import { useState } from 'react'
import type { StoryEntry, HeadlineInfo } from '../../shared/types'
import { lineageColor } from '../../shared/constants'
import { Modal } from './Modal'
import { t } from '../../i18n'
import { simText } from '../../i18n/simtext'
import { displayName } from '../../i18n/names'
import { WholeHistory } from '../../fork/chronicle/WholeHistory'
import { initialChronicleTab, wholeHistoryTab } from '../../fork/chronicle/navigate'

const DAY_LENGTH = 600

interface Props {
  stories: StoryEntry[]
  headlines?: HeadlineInfo[]
  onClose: () => void
}

type Tab = 'history' | 'lives' | 'all'

export function ChroniclesModal({ stories, headlines = [], onClose }: Props) {
  const [tab, setTab] = useState<Tab>(() => initialChronicleTab('history'))
  const sortedStories = [...stories]
  // Headlines arrive newest-first; show as a descending timeline.
  const timeline = [...headlines]

  return (
    <Modal
      open
      onClose={onClose}
      className="lang-modal chronicles-modal"
      title={t('chronicles.title')}
      hideTitle
    >
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('chronicles.heading')}</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', marginRight: 8 }}>
          {(['history', 'lives', ...wholeHistoryTab()] as Tab[]).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? 'rgba(216,178,112,0.18)' : 'transparent',
                border: `1px solid ${tab === id ? 'rgba(216,178,112,0.5)' : '#2a2520'}`,
                color: tab === id ? '#e0c98f' : '#998',
                padding: '3px 10px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {id === 'history'
                ? t('chronicles.tab.history')
                : id === 'lives'
                  ? t('chronicles.tab.lives')
                  : t('chronicle.tab')}
            </button>
          ))}
        </div>
        <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="lang-modal-body">
        {tab === 'all' ? (
          <WholeHistory />
        ) : tab === 'history' ? (
          <>
            <p className="lang-modal-sub">{t('chronicles.history.sub')}</p>
            {timeline.length === 0 ? (
              <div className="lang-no-stories">{t('chronicles.history.empty')}</div>
            ) : (
              <div className="chronicle-list">
                {timeline.map((h, i) => (
                  <div key={`${h.tick}-${i}`} className="chronicle-row">
                    <span className="chronicle-day">
                      {t('life.day', { n: Math.floor(h.tick / DAY_LENGTH) })}
                    </span>
                    <span className="chronicle-text">{simText('headline', h.text)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="lang-modal-sub">{t('chronicles.lives.sub')}</p>
            {sortedStories.length === 0 ? (
              <div className="lang-no-stories">{t('chronicles.lives.empty')}</div>
            ) : (
              <div className="chronicle-list">
                {sortedStories.map((s, i) => (
                  <div key={i} className="chronicle-row">
                    <span className="chronicle-day">
                      {t('life.day', { n: Math.floor(s.tick / DAY_LENGTH) })}
                    </span>
                    <span className="chronicle-name" style={{ color: lineageColor(s.lineage_id) }}>
                      {displayName(s.org_name)}
                    </span>
                    <span className="chronicle-text">{s.story}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
