import { personName } from '../../../shared/personName'
import { personTitles } from '../../../game/model/titles'
import clsx from 'clsx'
import { Tooltip } from '../../toolbar/Tooltip'
import { DAY_LENGTH, fmt } from './format'
import { HomeButton } from './HomeButton'
import type { OrganismState } from '../../../shared/types'
import { t, tn } from '../../../i18n'

export function OrgHeader({
  org,
  color,
  isSick,
  carrying,
  isStarred,
  toggleStar,
  setShowLife,
  following,
  onFollow,
  onClose,
  tn: tribeName,
}: {
  org: OrganismState
  color: string
  isSick: boolean
  carrying: boolean
  isStarred: boolean
  toggleStar: (id: string) => void
  setShowLife: (show: boolean) => void
  following: boolean
  onFollow: (id: string | null) => void
  onClose: () => void
  tn: (lid: string) => string
}) {
  const ageInDays = Math.floor(org.age / DAY_LENGTH)
  return (
    <>
      <div className="org-detail-header">
        <span className="org-detail-dot" style={{ background: color }} />
        <span className="org-detail-name">{personName(org)}</span>
        {personTitles(org).map((title) => (
          <span key={title} className="org-title-badge">
            {title}
          </span>
        ))}
        {isSick && (
          <span className="org-sick-badge">
            {t(org.sex === 'female' ? 'panel.org.sickFemale' : 'panel.org.sick')}
          </span>
        )}
        {carrying && (
          <Tooltip tip={t('person.carryingWood')}>
            <span className="org-carrying-badge" style={{ cursor: 'default' }}>
              🪵
            </span>
          </Tooltip>
        )}
        <span className="org-detail-actions">
          <Tooltip tip={isStarred ? t('person.unstar') : t('person.starTip')}>
            <button
              className={clsx('icon-btn', isStarred && 'active-star')}
              aria-label={isStarred ? t('person.unstar') : t('person.star')}
              onClick={() => toggleStar(org.id)}
            >
              {isStarred ? '★' : '☆'}
            </button>
          </Tooltip>
          <Tooltip tip={t('person.lifeTip')}>
            <button className="icon-btn" aria-label={t('person.lifeAria')} onClick={() => setShowLife(true)}>
              📖
            </button>
          </Tooltip>
          <HomeButton org={org} />
          <Tooltip tip={following ? t('person.following') : t('person.followTip')}>
            <button
              className={clsx('icon-btn', following && 'active')}
              aria-label={following ? t('person.unfollow') : t('person.follow')}
              onClick={() => onFollow(following ? null : org.id)}
            >
              ⊙
            </button>
          </Tooltip>
          <button aria-label={t('common.close')} className="icon-btn icon-close" onClick={onClose}>
            ✕
          </button>
        </span>
      </div>

      <div className="org-detail-sub">
        {t('person.gen', { n: org.generation })}
        {' · '}
        {ageInDays > 0
          ? tn('person.daysOld', ageInDays)
          : t(org.sex === 'female' ? 'person.newbornFemale' : 'person.newborn')}
        {' · '}
        {tribeName(org.lineage_id)}
        {org.max_age > 0 && t('person.maxAge', { age: fmt(org.max_age) })}
      </div>
    </>
  )
}
