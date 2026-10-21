import { Tooltip } from '../../toolbar/Tooltip'
import { Bar } from './bars'
import { TOOL_ICON } from './icons'
import type { OrganismState, ReligionInfo } from '../../../shared/types'
import { fmtNumber, t, type MessageKey } from '../../../i18n'
import { cargoLabel, prettifyId, simLabel } from '../../../i18n/sim'
import { simFaithName } from '../../../i18n/simtext'

/** The subjects a university grants degrees in (pick_degree in sim/civ/civ_tick/people.rs). */
const DEGREES: Record<string, MessageKey> = {
  philosophy: 'person.degree.philosophy',
  arts: 'person.degree.arts',
  law: 'person.degree.law',
  history: 'person.degree.history',
  literature: 'person.degree.literature',
  medicine: 'person.degree.medicine',
  mathematics: 'person.degree.mathematics',
  astronomy: 'person.degree.astronomy',
  theology: 'person.degree.theology',
  architecture: 'person.degree.architecture',
  engineering: 'person.degree.engineering',
  economics: 'person.degree.economics',
  science: 'person.degree.science',
}

const degreeName = (d: string) => (DEGREES[d] ? t(DEGREES[d]) : prettifyId(d))

export function EducationSection({ org }: { org: OrganismState }) {
  return (
    <>
      {((org.literacy ?? null) !== null || (org.degrees ?? []).length > 0) && (
        <>
          <div className="org-detail-section">{t('person.education.title')}</div>
          {(org.literacy ?? null) !== null && (
            <Bar label={t('person.education.literacy')} value={org.literacy ?? 0} color="#c4a8ff" />
          )}
          {(org.degrees ?? []).length > 0 && (
            <div className="relation-list">
              {(org.degrees ?? []).map((d) => (
                <span
                  key={d}
                  className="relation-tag"
                  style={{ background: '#1a0a2a', color: '#d8b8ff', cursor: 'default' }}
                >
                  🎓 {degreeName(d)}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

export function WealthSection({ org }: { org: OrganismState }) {
  return (
    <>
      {(org.wealth ?? null) !== null && (org.wealth ?? 0) > 0 && (
        <>
          <div className="org-detail-section">{t('person.wealth.title')}</div>
          <div className="org-memory" style={{ marginBottom: 6 }}>
            <span style={{ cursor: 'default' }}>💰 {fmtNumber(org.wealth ?? 0)}</span>
          </div>
        </>
      )}
    </>
  )
}

export function InventorySection({ org }: { org: OrganismState }) {
  return (
    <>
      {(() => {
        const bag: Record<string, number> = {
          ...(org.inventory ?? {}),
          ...(org.tools ?? {}),
        }
        const entries = Object.entries(bag).filter(([, n]) => n > 0)
        if (entries.length === 0) return null
        entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        return (
          <>
            <div className="org-detail-section">{t('person.inventory.title')}</div>
            <div className="relation-list">
              {entries.map(([kind, count]) => (
                <Tooltip key={kind} tip={t('person.inventory.item', { item: cargoLabel(kind), n: count })}>
                  <span
                    className="relation-tag"
                    style={{ background: '#0a1a1a', color: '#88e6d4', cursor: 'default' }}
                  >
                    {TOOL_ICON[kind] ?? '🧰'}{' '}
                    {t('person.inventory.item', { item: cargoLabel(kind), n: count })}
                  </span>
                </Tooltip>
              ))}
            </div>
          </>
        )
      })()}
    </>
  )
}

export function ReligionSection({ org, religions }: { org: OrganismState; religions?: ReligionInfo[] }) {
  return (
    <>
      {(org.religion_id ?? null) !== null && (
        <>
          <div className="org-detail-section">{t('person.religion.title')}</div>
          <div style={{ marginBottom: 4, fontSize: 11, color: '#bbb' }}>
            ✦ {simFaithName(religions?.find((r) => r.id === org.religion_id)?.name ?? org.religion_id ?? '')}
          </div>
          {(org.piety ?? null) !== null && (
            <Bar label={t('person.religion.piety')} value={org.piety ?? 0} color="#e6c488" />
          )}
        </>
      )}
    </>
  )
}

export function DiseasesSection({ org }: { org: OrganismState }) {
  return (
    <>
      {(org.diseases ?? []).length > 0 && (
        <>
          <div className="org-detail-section">{t('person.diseases.title')}</div>
          <div className="relation-list">
            {(org.diseases ?? []).map((d, i) => (
              <Tooltip
                key={`${d.kind}-${i}`}
                tip={t('person.diseases.tip', { disease: simLabel('disease', d.kind), tick: d.started_tick })}
              >
                <span className="relation-tag enemy" style={{ cursor: 'default' }}>
                  🦠 {simLabel('disease', d.kind)}
                </span>
              </Tooltip>
            ))}
          </div>
        </>
      )}
    </>
  )
}
