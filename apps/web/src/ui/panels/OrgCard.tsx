import { personName } from '../../shared/personName'
import { memo, useCallback } from 'react'
import clsx from 'clsx'
import { lineageColor, cbColor } from '../../shared/constants'
import { useUIStore } from '../../state/store'
import { useOrganism, useWorldStore } from '../../state/worldStore'
import { Tooltip } from '../toolbar/Tooltip'
import { RenameForm } from './RenameForm'
import { ageInYears } from '../../game/model/calendar'
import { shownGeneration } from '../../game/model/generations'
import { fmtNumber, t, tn } from '../../i18n'
import { simLabel } from '../../i18n/sim'

function Bar({ label, value, color, tip }: { label: string; value: number; color: string; tip?: string }) {
  const labelEl = (
    <span className="bar-label" style={{ cursor: 'default' }}>
      {label}
    </span>
  )
  return (
    <div className="bar-row">
      {tip ? <Tooltip tip={tip}>{labelEl}</Tooltip> : labelEl}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value * 100}%`, background: cbColor(color) }} />
      </div>
      <span className="bar-pct">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

function TraitBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="trait-bar-track">
      <div className="trait-bar-fill" style={{ width: `${value * 100}%`, background: cbColor(color) }} />
    </div>
  )
}

interface OrgCardProps {
  orgId: string
}

function OrgCardImpl({ orgId }: OrgCardProps) {
  const org = useOrganism(orgId)
  const sexWords = useWorldStore((s) => s.world?.sex_words)
  const lineageNames = useWorldStore((s) => s.world?.lineage_names)
  const followOrg = useUIStore((s) => s.followOrg)
  const openConvo = useUIStore((s) => s.openConvo)
  const onTrack = useCallback(() => orgId && followOrg(orgId), [orgId, followOrg])
  const onConvos = useCallback(() => orgId && openConvo(orgId), [orgId, openConvo])
  const renamingOrgId = useUIStore((s) => s.renamingOrgId)
  const startRename = useUIStore((s) => s.startRename)

  if (!org) return null
  if (!org.lineage_id || !org.traits || !org.name) return null

  const tribeName = (lid: string) => lineageNames?.[lid] ?? (lid ?? '').slice(0, 6)
  const on = (oid: string) => {
    const other = useWorldStore.getState().byId.get(oid)
    return other ? personName(other) : (oid ?? '').slice(0, 5)
  }
  const isSick = org.infection > 0.15
  const sexLabel = sexWords ? (org.sex === 'female' ? sexWords[1] : sexWords[0]) : undefined
  const convoCount = org.conversation_count ?? 0
  const female = org.sex === 'female'

  return (
    <div
      className={clsx('org-card', isSick && 'sick')}
      style={{ borderLeft: `3px solid ${lineageColor(org.lineage_id)}` }}
    >
      <div className="org-header">
        <span className="org-name">
          {personName(org)}
          {org.surname ? <span className="org-surname"> {org.surname}</span> : null}
        </span>
        {isSick && (
          <Tooltip tip={t('panel.org.infected', { pct: (org.infection * 100).toFixed(0) })}>
            <span className="org-sick-badge" style={{ cursor: 'default' }}>
              {t(female ? 'panel.org.sickFemale' : 'panel.org.sick')}
            </span>
          </Tooltip>
        )}
        {org.pregnant && (
          <Tooltip tip={t('panel.org.pregnantTip')}>
            <span className="org-pregnant-badge" style={{ cursor: 'default' }}>
              {t('panel.org.expecting')}
            </span>
          </Tooltip>
        )}
        {sexLabel && sexWords && (
          <Tooltip
            tip={
              <span>
                <span style={{ opacity: 0.6 }}>{t('panel.org.sexWords')}</span>
                <br />
                <span style={{ color: '#7ab0e0' }}>
                  <b>{sexWords[0]}</b>
                </span>
                {' · '}
                <span style={{ color: '#e09ab0' }}>
                  <b>{sexWords[1]}</b>
                </span>
                <br />
                <span style={{ opacity: 0.5 }}>{t('panel.org.sexWordsCoined')}</span>
              </span>
            }
          >
            <span
              className="org-sex-badge"
              style={{ color: org.sex === 'female' ? '#e09ab0' : '#7ab0e0', cursor: 'default' }}
            >
              {sexLabel}
            </span>
          </Tooltip>
        )}
        <Tooltip
          tip={tn('panel.org.metaTip', org.age, {
            gen: shownGeneration(org.generation),
            age: ageInYears(org.age),
          })}
        >
          <span className="org-meta" style={{ cursor: 'default' }}>
            {t('panel.org.meta', { gen: shownGeneration(org.generation), age: ageInYears(org.age) })}
          </span>
        </Tooltip>
        <span className="org-action-btns">
          <button
            className="org-action-btn org-rename-btn"
            title={t('panel.org.renameTip')}
            aria-label={t('panel.org.renameAria')}
            onClick={(e) => {
              e.stopPropagation()
              startRename(org.id)
            }}
          >
            ✎
          </button>
          {convoCount > 0 && onConvos && (
            <button
              className="org-action-btn org-convo-btn"
              title={tn('panel.org.conversations', convoCount)}
              onClick={(e) => {
                e.stopPropagation()
                onConvos()
              }}
            >
              💬{convoCount}
            </button>
          )}
          <button
            className="org-action-btn org-tree-btn"
            title={t('panel.org.familyTree')}
            onClick={(e) => {
              e.stopPropagation()
              useUIStore.getState().openFamilyTree(org.id)
            }}
          >
            🌳
          </button>
          {onTrack && (
            <button
              className="org-action-btn org-track-btn"
              title={t('panel.org.track')}
              onClick={(e) => {
                e.stopPropagation()
                onTrack()
              }}
            >
              ⊕
            </button>
          )}
        </span>
      </div>

      {renamingOrgId === org.id && <RenameForm org={org} />}
      {org.attracted_to && !org.partner_id && (
        <Tooltip tip={t('panel.org.attractionTip')}>
          <div className="org-attraction" style={{ cursor: 'default' }}>
            {t(female ? 'panel.org.attractionFemale' : 'panel.org.attraction')}
          </div>
        </Tooltip>
      )}

      <div className="org-thought">{org.thought}</div>

      {org.attributes && org.attributes.length > 0 && (
        <div className="org-attributes">
          {org.attributes.slice(0, 8).map((attr) => (
            <span key={attr} className="org-attr-tag">
              {simLabel('attribute', attr)}
            </span>
          ))}
          {org.attributes.length > 8 && (
            <span className="org-attr-tag org-attr-more">+{fmtNumber(org.attributes.length - 8)}</span>
          )}
        </div>
      )}

      <Bar label={t('panel.org.energy')} value={org.energy} color="#55dd55" tip={t('panel.org.energyTip')} />
      <Bar
        label={t('panel.org.hydration')}
        value={org.hydration}
        color="#4499ff"
        tip={t('panel.org.hydrationTip')}
      />
      <Bar label="♥" value={org.health} color="#ff6644" tip={t('panel.org.healthTip')} />
      {isSick && <Bar label="🤒" value={org.infection} color="#bbff44" tip={t('panel.org.infectionTip')} />}

      <div className="trait-grid">
        <TraitBar value={org.traits.curiosity} color="#88aaff" />
        <TraitBar value={org.traits.aggression} color="#ff6655" />
        <TraitBar value={org.traits.fear} color="#ffcc44" />
        <TraitBar value={org.traits.memory_strength} color="#aa88ff" />
        <TraitBar value={org.traits.social_tendency} color="#55ddaa" />
        <TraitBar value={org.traits.resilience} color="#ff8844" />
      </div>
      <div className="trait-labels">
        <Tooltip tip={t('panel.org.trait.curTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.cur')}</span>
        </Tooltip>
        <Tooltip tip={t('panel.org.trait.aggTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.agg')}</span>
        </Tooltip>
        <Tooltip tip={t('panel.org.trait.fearTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.fear')}</span>
        </Tooltip>
        <Tooltip tip={t('panel.org.trait.memTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.mem')}</span>
        </Tooltip>
        <Tooltip tip={t('panel.org.trait.socTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.soc')}</span>
        </Tooltip>
        <Tooltip tip={t('panel.org.trait.resTip')}>
          <span style={{ cursor: 'default' }}>{t('panel.org.trait.res')}</span>
        </Tooltip>
      </div>

      <div className="org-memory">
        <Tooltip tip={t('panel.org.memFoodTip', { n: org.memory_count?.food ?? 0 })}>
          <span style={{ cursor: 'default' }}>
            {t('panel.org.memFood', { n: org.memory_count?.food ?? 0 })}
          </span>
        </Tooltip>
        <Tooltip tip={t('panel.org.memWaterTip', { n: org.memory_count?.water ?? 0 })}>
          <span style={{ cursor: 'default' }}>
            {t('panel.org.memWater', { n: org.memory_count?.water ?? 0 })}
          </span>
        </Tooltip>
        <Tooltip tip={t('panel.org.memDangerTip', { n: org.memory_count?.danger ?? 0 })}>
          <span style={{ cursor: 'default' }}>
            {t('panel.org.memDanger', { n: org.memory_count?.danger ?? 0 })}
          </span>
        </Tooltip>
      </div>

      {org.attitudes && Object.keys(org.attitudes).length > 0 && (
        <div className="org-attitudes">
          {Object.entries(org.attitudes)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 3)
            .map(([lid, att]) => (
              <span
                key={lid}
                className="attitude-tag"
                style={{ color: att >= 0.25 ? '#55ff88' : att <= -0.25 ? '#ff5544' : '#aaa' }}
              >
                {att >= 0.25 ? '♥' : att <= -0.25 ? '✕' : '~'}
                {tribeName(lid)}
              </span>
            ))}
        </div>
      )}

      {org.friends && Object.keys(org.friends).length > 0 && (
        <div className="org-attitudes">
          <span style={{ fontSize: '7px', color: '#ffd070', marginRight: 2 }}>{t('panel.org.friends')}</span>
          {Object.entries(org.friends)
            .slice(0, 3)
            .map(([id, name], i) => (
              <span
                key={`${id}-${name}-${i}`}
                className="attitude-tag"
                style={{ color: '#ffd070', fontSize: '7px' }}
              >
                ♦{name}
              </span>
            ))}
        </div>
      )}

      {org.org_trust && Object.keys(org.org_trust).length > 0 && (
        <div className="org-attitudes">
          {Object.entries(org.org_trust)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 3)
            .map(([oid, trust]) => (
              <span
                key={oid}
                className="attitude-tag"
                style={{
                  color: trust >= 0.3 ? '#aaffdd' : trust <= -0.3 ? '#ff8866' : '#777',
                  fontSize: '7px',
                }}
              >
                {trust >= 0.3 ? '◆' : trust <= -0.3 ? '◇' : '○'}
                {on(oid)}
              </span>
            ))}
        </div>
      )}
    </div>
  )
}

export const OrgCard = memo(OrgCardImpl)
