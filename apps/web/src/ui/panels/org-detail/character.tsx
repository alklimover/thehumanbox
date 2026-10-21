import { Tooltip } from '../../toolbar/Tooltip'
import { cbColor } from '../../../shared/constants'
import { MiniBar } from './bars'
import { ASPIRATION_EMOJI, ASPIRATION_TIPS, ZODIAC_GLYPH, ZODIAC_FLAVOR } from './icons'
import type { OrganismState, OrgDetail } from '../../../shared/types'
import { t, tn, type MessageKey } from '../../../i18n'
import { simLabel } from '../../../i18n/sim'

/** A catalog line for an id, or nothing when the id has none. */
const lineFor = (keys: Record<string, MessageKey>, id: string) => (keys[id] ? t(keys[id]) : '')

export function AspirationSection({ org }: { org: OrganismState }) {
  return (
    <>
      {org.aspiration && (
        <>
          <div className="org-detail-section">{t('person.aspiration.title')}</div>
          <div className="relation-list">
            <span
              className="relation-tag"
              style={{ background: '#1a1408', color: '#f6d062', cursor: 'default' }}
              title={lineFor(ASPIRATION_TIPS, org.aspiration)}
            >
              {ASPIRATION_EMOJI[org.aspiration] ?? '✦'} {simLabel('aspiration', org.aspiration)}
            </span>
          </div>
        </>
      )}
    </>
  )
}

export function LearningSection({ detail }: { detail: OrgDetail | null }) {
  return (
    <>
      {detail?.learning && detail.learning.states > 0 && (
        <>
          <div className="org-detail-section">{t('person.learning.title')}</div>
          <div className="trait-full-grid">
            <MiniBar
              label={t('person.learning.confidence')}
              value={detail.learning.confidence}
              color="#79d6b0"
              tip={t('person.learning.confidenceTip')}
            />
            <div className="trait-full-row">
              <Tooltip tip={t('person.learning.experienceTip')}>
                <span className="trait-full-label" style={{ cursor: 'default' }}>
                  {t('person.learning.experience')}
                </span>
              </Tooltip>
              <span className="bar-pct">{tn('person.learning.states', detail.learning.states)}</span>
            </div>
            <div className="trait-full-row">
              <Tooltip tip={t('person.learning.triedTip')}>
                <span className="trait-full-label" style={{ cursor: 'default' }}>
                  {t('person.learning.tried')}
                </span>
              </Tooltip>
              <span className="bar-pct">{detail.learning.tried_actions}</span>
            </div>
            <div className="trait-full-row">
              <Tooltip tip={t('person.learning.lessonsTip')}>
                <span className="trait-full-label" style={{ cursor: 'default' }}>
                  {t('person.learning.lessons')}
                </span>
              </Tooltip>
              <span className="bar-pct">{detail.learning.promising_states}</span>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export function ZodiacSection({ org }: { org: OrganismState }) {
  return (
    <>
      {org.zodiac && (
        <>
          <div className="org-detail-section">{t('person.zodiac.title')}</div>
          <div className="relation-list">
            <span
              className="relation-tag"
              style={{ background: '#0e1018', color: '#9ad0f0', cursor: 'default' }}
              title={lineFor(ZODIAC_FLAVOR, org.zodiac)}
            >
              {ZODIAC_GLYPH[org.zodiac] ?? '✦'} {simLabel('zodiac', org.zodiac)}
            </span>
            <span style={{ color: '#666', fontSize: 11, marginLeft: 6, fontStyle: 'italic' }}>
              {lineFor(ZODIAC_FLAVOR, org.zodiac)}
            </span>
          </div>
        </>
      )}
    </>
  )
}

export function TraitsSection({ org }: { org: OrganismState }) {
  return (
    <>
      <div className="org-detail-section">{t('person.traits.title')}</div>
      <div className="trait-full-grid">
        {(
          [
            ['person.traits.curiosity', org.traits.curiosity, '#88aaff', 'person.traits.curiosityTip'],
            ['person.traits.aggression', org.traits.aggression, '#ff6655', 'person.traits.aggressionTip'],
            ['person.traits.fear', org.traits.fear, '#ffcc44', 'person.traits.fearTip'],
            ['person.traits.memory', org.traits.memory_strength, '#aa88ff', 'person.traits.memoryTip'],
            ['person.traits.social', org.traits.social_tendency, '#55ddaa', 'person.traits.socialTip'],
            ['person.traits.resilience', org.traits.resilience, '#ff8844', 'person.traits.resilienceTip'],
          ] as [MessageKey, number, string, MessageKey][]
        ).map(([label, val, col, tip]) => (
          <div key={label} className="trait-full-row">
            <Tooltip tip={t(tip)}>
              <span className="trait-full-label" style={{ cursor: 'default' }}>
                {t(label)}
              </span>
            </Tooltip>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${val * 100}%`, background: cbColor(col) }} />
            </div>
            <span className="bar-pct">{(val * 100).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </>
  )
}
