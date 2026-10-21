import { memo } from 'react'
import clsx from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import { useWorldStore } from '../../state/worldStore'
import { isHerdLabel, wildlifeCounts } from '../../game/model/wildlife'
import { Tooltip } from '../toolbar/Tooltip'
import { t } from '../../i18n'

/** What lives on the land: game to hunt, herds, and what hunts people. */
function WildlifePanelImpl() {
  // A flat string keeps the panel from re-rendering every tick.
  const stamp = useWorldStore(
    useShallow((s) =>
      wildlifeCounts(s.world?.animals).map((c) => `${c.label}:${c.count}:${c.away ?? 0}:${c.danger ? 1 : 0}`),
    ),
  )
  if (stamp.length === 0) return null
  return (
    <>
      <div className="section-title">{t('panel.wildlife.title')}</div>
      <div className="history-grid">
        {stamp.map((row) => {
          const [label, count, away, danger] = row.split(':')
          return (
            <span key={label} style={{ display: 'contents' }}>
              <Tooltip
                tip={
                  danger === '1'
                    ? t('panel.wildlife.dangerTip')
                    : isHerdLabel(label!)
                      ? t('panel.wildlife.herdTip')
                      : t('panel.wildlife.gameTip')
                }
              >
                <span
                  className={clsx('hist-label', danger === '1' && 'wildlife-danger')}
                  style={{ cursor: 'default' }}
                >
                  {label}
                </span>
              </Tooltip>
              <span className="hist-val">
                {count}
                {Number(away) > 0 && (
                  <span className="wildlife-away">{t('panel.wildlife.away', { n: Number(away) })}</span>
                )}
              </span>
            </span>
          )
        })}
      </div>
    </>
  )
}

export const WildlifePanel = memo(WildlifePanelImpl)
