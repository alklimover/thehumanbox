import clsx from 'clsx'
import { useUIStore, useViewFlag } from '../../state/store'
import { SHORTCUT_HELP } from '../../game/model/shortcuts'
import { t } from '../../i18n'
import { saveMapPicture } from '../../shared/mapPicture'
import { useWorldStore } from '../../state/worldStore'
import { Tooltip } from './Tooltip'
import { saveBlocked, saveLabel, saveShortcutLabel, type WorldActions } from './world-actions'

/**
 * `onAction` runs whenever the dropdown closes (an action or a toggle). `worldActions` puts
 * "Find a tool" and "Save world" at the top; the phone menu has rows of its own for them.
 */
export function MoreDropdown({
  onAction,
  worldActions,
}: { onAction?: () => void; worldActions?: WorldActions } = {}) {
  const focus = useUIStore((s) => s.focus)
  const leftOpen = useUIStore((s) => s.leftOpen)
  const setFocus = useUIStore((s) => s.setFocus)
  const setViewFlag = useUIStore((s) => s.setViewFlag)
  const toggleLeft = useUIStore((s) => s.toggleLeft)
  const openLanguages = useUIStore((s) => s.openLanguages)
  const openFamilyTree = useUIStore((s) => s.openFamilyTree)
  const openAchievements = useUIStore((s) => s.openAchievements)
  const openGoals = useUIStore((s) => s.openGoals)
  const openScenarios = useUIStore((s) => s.openScenarios)
  const openNotable = useUIStore((s) => s.openNotable)
  const pauseOnPeril = useUIStore((s) => s.pauseOnPeril)
  const setPauseOnPeril = useUIStore((s) => s.setPauseOnPeril)

  const lineageDot = useViewFlag('lineageDot')
  const health = useViewFlag('health')
  const age = useViewFlag('age')
  const fear = useViewFlag('fear')
  const partners = useViewFlag('partners')
  const pregnancy = useViewFlag('pregnancy')
  const trails = useViewFlag('trails')
  const structures = useViewFlag('structures')
  const fertility = useViewFlag('fertility')
  const hazard = useViewFlag('hazard')
  const history = useViewFlag('history')
  const fps = useViewFlag('fps')

  const closeMore = () => {
    useUIStore.setState({ showMore: false })
    onAction?.()
  }

  const { findTool, save } = worldActions ?? {}

  return (
    <div className="more-dropdown">
      {(findTool || save) && (
        <>
          <div className="more-dropdown-actions">
            {findTool && (
              <button
                type="button"
                className="more-dropdown-action"
                onClick={() => {
                  closeMore()
                  findTool()
                }}
              >
                <span>{t('more.findTool')}</span>
                <kbd>/</kbd>
              </button>
            )}
            {save && (
              <button
                type="button"
                className={clsx('more-dropdown-action', save.error && 'error', save.busy && 'busy')}
                onClick={save.onSave}
                disabled={saveBlocked(save)}
                aria-busy={save.busy}
                aria-keyshortcuts="Meta+S Control+S"
              >
                <span>{saveLabel(save)}</span>
                <kbd>{saveShortcutLabel()}</kbd>
                {save.status && (
                  <small className="more-dropdown-status" role="status">
                    {save.status}
                  </small>
                )}
              </button>
            )}
          </div>
          <div className="more-dropdown-divider" />
        </>
      )}
      <div className="more-dropdown-section">{t('more.focus')}</div>
      <div className="more-dropdown-grid">
        <Tooltip tip={t('more.focus.all.tip')}>
          <button
            className={clsx('lang-btn', focus === 'all' && 'active')}
            aria-pressed={!!(focus === 'all')}
            onClick={() => setFocus('all')}
          >
            {t('more.focus.all')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.focus.sick.tip')}>
          <button
            className={clsx('lang-btn', focus === 'sick' && 'active')}
            aria-pressed={!!(focus === 'sick')}
            onClick={() => setFocus(focus === 'sick' ? 'all' : 'sick')}
          >
            {t('more.focus.sick')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.focus.hungry.tip')}>
          <button
            className={clsx('lang-btn', focus === 'hungry' && 'active')}
            aria-pressed={!!(focus === 'hungry')}
            onClick={() => setFocus(focus === 'hungry' ? 'all' : 'hungry')}
          >
            {t('more.focus.hungry')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.focus.elders.tip')}>
          <button
            className={clsx('lang-btn', focus === 'elders' && 'active')}
            aria-pressed={!!(focus === 'elders')}
            onClick={() => setFocus(focus === 'elders' ? 'all' : 'elders')}
          >
            {t('more.focus.elders')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.focus.builders.tip')}>
          <button
            className={clsx('lang-btn', focus === 'builders' && 'active')}
            aria-pressed={!!(focus === 'builders')}
            onClick={() => setFocus(focus === 'builders' ? 'all' : 'builders')}
          >
            {t('more.focus.builders')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.focus.thriving.tip')}>
          <button
            className={clsx('lang-btn', focus === 'thriving' && 'active')}
            aria-pressed={!!(focus === 'thriving')}
            onClick={() => setFocus(focus === 'thriving' ? 'all' : 'thriving')}
          >
            {t('more.focus.thriving')}
          </button>
        </Tooltip>
      </div>

      <div className="more-dropdown-divider" />
      <div className="more-dropdown-section">{t('more.decorations')}</div>
      <div className="more-dropdown-grid">
        <Tooltip tip={t('more.lineage.tip')}>
          <button
            className={clsx('lang-btn', lineageDot && 'active')}
            aria-pressed={!!lineageDot}
            onClick={() => setViewFlag('lineageDot', !lineageDot)}
          >
            {t('more.lineage')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.health.tip')}>
          <button
            className={clsx('lang-btn', health && 'active')}
            aria-pressed={!!health}
            onClick={() => setViewFlag('health', !health)}
          >
            {t('more.health')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.age.tip')}>
          <button
            className={clsx('lang-btn', age && 'active')}
            aria-pressed={!!age}
            onClick={() => setViewFlag('age', !age)}
          >
            {t('more.age')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.fear.tip')}>
          <button
            className={clsx('lang-btn', fear && 'active')}
            aria-pressed={!!fear}
            onClick={() => setViewFlag('fear', !fear)}
          >
            {t('more.fear')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.pairs.tip')}>
          <button
            className={clsx('lang-btn', partners && 'active')}
            aria-pressed={!!partners}
            onClick={() => setViewFlag('partners', !partners)}
          >
            {t('more.pairs')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.pregnant.tip')}>
          <button
            className={clsx('lang-btn', pregnancy && 'active')}
            aria-pressed={!!pregnancy}
            onClick={() => setViewFlag('pregnancy', !pregnancy)}
          >
            {t('more.pregnant')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.trails.tip')}>
          <button
            className={clsx('lang-btn', trails && 'active')}
            aria-pressed={!!trails}
            onClick={() => setViewFlag('trails', !trails)}
          >
            {t('more.trails')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.builds.tip')}>
          <button
            className={clsx('lang-btn', structures && 'active')}
            aria-pressed={!!structures}
            onClick={() => setViewFlag('structures', !structures)}
          >
            {t('more.builds')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.fertility.tip')}>
          <button
            className={clsx('lang-btn', fertility && 'active')}
            aria-pressed={!!fertility}
            onClick={() => setViewFlag('fertility', !fertility)}
          >
            {t('more.fertility')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.hazard.tip')}>
          <button
            className={clsx('lang-btn', hazard && 'active')}
            aria-pressed={!!hazard}
            onClick={() => setViewFlag('hazard', !hazard)}
          >
            {t('more.hazard')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.history.tip')}>
          <button
            className={clsx('lang-btn', history && 'active')}
            aria-pressed={!!history}
            onClick={() => setViewFlag('history', !history)}
          >
            {t('more.history')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.perf.tip')}>
          <button
            className={clsx('lang-btn', fps && 'active')}
            aria-pressed={!!fps}
            onClick={() => setViewFlag('fps', !fps)}
          >
            {t('more.perf')}
          </button>
        </Tooltip>
      </div>

      <div className="more-dropdown-divider" />
      <div className="more-dropdown-grid">
        <Tooltip tip={t('more.languages.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openLanguages()
              closeMore()
            }}
          >
            {t('more.languages')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.scenes.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openScenarios()
              closeMore()
            }}
          >
            {t('more.scenes')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.feats.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openAchievements()
              closeMore()
            }}
          >
            {t('more.feats')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.goals.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openGoals()
              closeMore()
            }}
          >
            {t('more.goals')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.tree.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openFamilyTree()
              closeMore()
            }}
          >
            {t('more.tree')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.world.tip')}>
          <button
            className={clsx('lang-btn', leftOpen && 'active')}
            aria-pressed={!!leftOpen}
            onClick={() => {
              toggleLeft()
              closeMore()
            }}
          >
            {t('more.world')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.onBrink.tip')}>
          <button
            className={clsx('lang-btn', pauseOnPeril && 'active')}
            aria-pressed={pauseOnPeril}
            onClick={() => setPauseOnPeril(!pauseOnPeril)}
          >
            {t('more.onBrink')}
          </button>
        </Tooltip>
        <Tooltip
          tip={
            <span className="tip-card">
              <strong>{t('more.keys.title')}</strong>
              {SHORTCUT_HELP.map(([key, what]) => (
                <span key={key}>
                  <b>{key}</b> {what}
                </span>
              ))}
            </span>
          }
        >
          <button className="lang-btn">{t('more.keys')}</button>
        </Tooltip>
        <Tooltip tip={t('more.picture.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              void saveMapPicture(useWorldStore.getState().world?.tick)
              closeMore()
            }}
          >
            {t('more.picture')}
          </button>
        </Tooltip>
        <Tooltip tip={t('more.notable.tip')}>
          <button
            className="lang-btn"
            onClick={() => {
              openNotable()
              closeMore()
            }}
          >
            {t('more.notable')}
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
