import { useEffect, useState } from 'react'
import type { WorldState } from '../../shared/types'
import { everLived, livingCount, worldEpitaph } from '../../game/model/world-end'
import { fmtNumber, t, tn } from '../../i18n'
import { Modal } from '../modals/LazyModal'

interface Props {
  world: WorldState | null
  /** Pick up the tribe tool so the player can seed new people. */
  onSeed: () => void
  /** Start over in a new world, or null when this world can't be reset here. */
  onNewWorld: (() => void) | null
}

/**
 * When the last person dies the world falls silent. Nobody migrates into
 * an empty land, so this is the end unless the player seeds new people.
 */
export function WorldSilent({ world, onSeed, onNewWorld }: Props) {
  const silent = !!world && world.tick > 0 && livingCount(world) === 0 && everLived(world)
  const [dismissed, setDismissed] = useState(false)

  // Mourn again if a later world (or a later extinction) falls silent.
  useEffect(() => {
    if (!silent) setDismissed(false)
  }, [silent])

  if (!silent || dismissed || !world) return null
  const e = worldEpitaph(world)
  const close = () => setDismissed(true)

  return (
    <Modal open onClose={close} className="confirm-modal world-silent" title={t('silent.title')}>
      <div className="confirm-body">
        <p>{t('silent.body')}</p>
        <dl className="world-silent-stats">
          <dt>{t('silent.lasted')}</dt>
          <dd>{tn('silent.years', e.years)}</dd>
          <dt>{t('silent.peak')}</dt>
          <dd>{fmtNumber(e.peak)}</dd>
          <dt>{t('silent.tribes')}</dt>
          <dd>{fmtNumber(e.tribes)}</dd>
          {e.era && (
            <>
              <dt>{t('silent.era')}</dt>
              <dd>{e.era}</dd>
            </>
          )}
          <dt>{t('silent.answered')}</dt>
          <dd>
            {fmtNumber(e.answered)}
            {e.forsaken > 0 && (
              <span className="world-silent-forsaken">{t('silent.unanswered', { n: e.forsaken })}</span>
            )}
          </dd>
        </dl>
      </div>
      <div className="confirm-actions">
        <button className="lang-btn" onClick={close}>
          {t('silent.keepWatching')}
        </button>
        {onNewWorld && (
          <button
            className="lang-btn"
            onClick={() => {
              close()
              onNewWorld()
            }}
          >
            {t('silent.newWorld')}
          </button>
        )}
        <button
          className="lang-btn primary"
          autoFocus
          onClick={() => {
            close()
            onSeed()
          }}
        >
          {t('silent.seed')}
        </button>
      </div>
    </Modal>
  )
}
