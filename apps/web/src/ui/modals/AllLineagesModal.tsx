import type { OrganismState, TribePeril } from '../../shared/types'
import { useUIStore } from '../../state/store'
import type { LineageFacts } from '../../game/model/lineage-facts'
import { PERIL_HELP, remainingLine, visibleLineages } from '../../game/model/tribe-peril'
import { lineageColor, lineageWord } from '../../shared/constants'
import { Modal } from './Modal'
import { t } from '../../i18n'
import { displayName } from '../../i18n/names'
import { simLabelAsSent } from '../../i18n/sim'

interface LineageInfo {
  count: number
  minGen: number
  maxGen: number
  orgs: OrganismState[]
}

/** "industrial age · empire · ✧-10", leaving out what is not known. The facts are the simulation's ids (ModalRouter). */
function factsLine(f: LineageFacts | undefined): string {
  if (!f) return ''
  return [
    f.era ? t('lineages.era', { era: simLabelAsSent('era', f.era) }) : '',
    f.government ? simLabelAsSent('government', f.government) : '',
    f.faith !== undefined ? `✧${f.faith}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

interface Props {
  lineages: Record<string, LineageInfo>
  lineageWords?: Record<string, Record<string, string>>
  lineageNames?: Record<string, string>
  peril?: TribePeril[]
  facts?: Record<string, LineageFacts>
  onClose: () => void
}

export function AllLineagesModal({ lineages, lineageWords, lineageNames, peril, facts, onClose }: Props) {
  const setFocus = useUIStore((s) => s.setFocus)
  const tribeName = (lid: string) => displayName(lineageNames?.[lid]) || (lid ?? '').slice(0, 6)
  const brink = new Map((peril ?? []).map((p) => [p.lineage_id, p.cause]))
  const rows = visibleLineages(
    Object.entries(lineages).map(([lid, info]) => ({ lid, info, count: info.count, peril: brink.get(lid) })),
    Infinity,
  )

  return (
    <Modal open onClose={onClose} className="lang-modal" title={t('lineages.title')} hideTitle>
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('lineages.heading', { n: Object.keys(lineages).length })}</span>
        <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="lang-modal-body">
        <div className="lineage-list">
          {rows.map(({ lid, info, peril: cause }) => (
            <div
              key={lid}
              role="button"
              tabIndex={0}
              onClick={() => {
                setFocus(`lineage:${lid}`)
                onClose()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setFocus(`lineage:${lid}`)
                  onClose()
                }
              }}
              className={'lineage-row all-lineages-row' + (cause ? ' peril' : '')}
              title={
                cause
                  ? t('lineages.brink', {
                      remaining: remainingLine(info.count),
                      reason: PERIL_HELP[cause].reason,
                    })
                  : undefined
              }
            >
              <span className="lineage-dot" style={{ background: lineageColor(lid) }} />
              <span className="lineage-id">{tribeName(lid)}</span>
              <span className="lineage-count">
                {cause && <span className="lineage-peril">⚠</span>}
                {info.count}
              </span>
              <span className="lineage-gen">
                {t('lineages.gen', {
                  gen: `${info.minGen}${info.maxGen > info.minGen ? `–${info.maxGen}` : ''}`,
                })}
              </span>
              <span className="lineage-strat">
                {displayName(
                  lineageWords?.[lid]?.home ||
                    lineageWords?.[lid]?.food ||
                    lineageWord(info.orgs, 'home') ||
                    lineageWord(info.orgs, 'food'),
                )}
              </span>
              <span className="lineage-facts">{factsLine(facts?.[lid])}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
