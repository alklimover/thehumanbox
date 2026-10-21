import { memo } from 'react'
import { useWorldStore } from '../../state/worldStore'
import type { WorldHistory } from '../../shared/types'
import { Tooltip } from '../toolbar/Tooltip'
import { t, type MessageKey } from '../../i18n'

/** Each row of the world's history: label, explanation, and its count. */
const ROWS: Array<[MessageKey, MessageKey, (h: WorldHistory) => number | undefined]> = [
  ['panel.history.births', 'panel.history.birthsTip', (h) => h.births],
  ['panel.history.oldAge', 'panel.history.oldAgeTip', (h) => h.deaths_old_age],
  ['panel.history.starvation', 'panel.history.starvationTip', (h) => h.deaths_starvation],
  ['panel.history.sickness', 'panel.history.sicknessTip', (h) => h.deaths_sickness],
  ['panel.history.combat', 'panel.history.combatTip', (h) => h.deaths_combat],
  ['panel.history.beasts', 'panel.history.beastsTip', (h) => h.deaths_beasts],
  ['panel.history.drowned', 'panel.history.drownedTip', (h) => h.deaths_drowning],
  ['panel.history.fire', 'panel.history.fireTip', (h) => h.deaths_fire],
  ['panel.history.disaster', 'panel.history.disasterTip', (h) => h.deaths_disaster],
  ['panel.history.alliances', 'panel.history.alliancesTip', (h) => h.alliances_formed],
  ['panel.history.challenges', 'panel.history.challengesTip', (h) => h.challenges_total],
  ['panel.history.gifts', 'panel.history.giftsTip', (h) => h.gifts_total],
  ['panel.history.droughts', 'panel.history.droughtsTip', (h) => h.droughts],
  ['panel.history.outbreaks', 'panel.history.outbreaksTip', (h) => h.outbreaks],
]

function HistoryGridImpl() {
  const h = useWorldStore((s) => s.world?.history)
  if (!h) return null
  return (
    <>
      <div className="section-title">{t('panel.history.title')}</div>
      <div className="history-grid">
        {ROWS.map(([label, tip, value]) => {
          const n = value(h)
          // Saves from before a cause was told apart have no count for it.
          if (n === undefined) return null
          return (
            <span key={label} style={{ display: 'contents' }}>
              <Tooltip tip={t(tip)}>
                <span className="hist-label" style={{ cursor: 'default' }}>
                  {t(label)}
                </span>
              </Tooltip>
              <span className="hist-val">{n}</span>
            </span>
          )
        })}
      </div>
    </>
  )
}

export const HistoryGrid = memo(HistoryGridImpl)
