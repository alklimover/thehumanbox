import { personName } from '../../../shared/personName'
import { t } from '../../../i18n'
import { roleLabel } from '../shared/role-label'
import type { SceneContext } from '../core/types'
import { useUIStore } from '../../../state/store'
import { HomeCanvas } from './HomeCanvas'

interface Props {
  ctx: SceneContext
  onExit: () => void
  onFocusOrg: (id: string) => void
}

export function HomeInterior({ ctx, onExit, onFocusOrg }: Props) {
  const selectedOrgId = useUIStore((s) => s.selectedOrgId)
  const { title, subtitle, occupants, away, isDay } = ctx

  return (
    <div className="scene-shell">
      <div className="scene-head">
        <button className="scene-back" onClick={onExit} aria-label={t('map.scene.backAria')}>
          {t('map.scene.back')}
        </button>
        <div className="scene-title-wrap">
          <div className="scene-title">{title}</div>
          <div className="scene-subtitle">{subtitle}</div>
        </div>
        <div className="scene-meta">
          {occupants.length === 0
            ? t('map.home.empty')
            : occupants.length === 1
              ? t('map.home.alone')
              : t('map.home.inside', { n: occupants.length })}
          {' · '}
          {isDay ? t('map.scene.day') : t('map.scene.night')}
        </div>
      </div>

      <div className="scene-stage scene-stage--pixel">
        <HomeCanvas ctx={ctx} selectedOrgId={selectedOrgId} onSelectOrg={onFocusOrg} />
      </div>

      {(occupants.length > 0 || away.length > 0) && (
        <div className="scene-occupants">
          {occupants.map((o) => (
            <button
              key={`in-${o.org.id}`}
              className={'scene-occupant-chip' + (o.org.id === selectedOrgId ? ' active' : '')}
              onClick={() => onFocusOrg(o.org.id)}
            >
              <span className="scene-occupant-role">{roleLabel(o.role)}</span>
              <span className="scene-occupant-name">{personName(o.org)}</span>
              <span className="scene-occupant-act">{o.activity}</span>
            </button>
          ))}
          {away.map((o) => (
            <button
              key={`out-${o.org.id}`}
              className={
                'scene-occupant-chip scene-occupant-chip--away' +
                (o.org.id === selectedOrgId ? ' active' : '')
              }
              onClick={() => onFocusOrg(o.org.id)}
              title={t('map.home.outTip')}
            >
              <span className="scene-occupant-role">{t('map.scene.out', { role: roleLabel(o.role) })}</span>
              <span className="scene-occupant-name">{personName(o.org)}</span>
              <span className="scene-occupant-act">{o.activity}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
