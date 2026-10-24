// Fork: the mode panel in the map's top-left corner. The observer's lists
// what is worth watching now; the god's lists who needs a power and which.
// Its buttons only move the camera and pick a power up, as the prayer bubbles
// and the tribe card do: whatever happens to the world, the player does.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { t } from '../../i18n'
import { goalTitle } from '../../i18n/goals'
import { calendarAt } from '../../game/model/calendar'
import { useCameraFocus } from '../../state/camera-focus'
import { useCurrentScene } from '../../state/scene'
import { useUIStore, useViewFlag } from '../../state/store'
import type { PrayerInfo, WorldState } from '../../shared/types'
import { ToolSprite } from '../../ui/toolbar/ToolSprite'
import { ROLE_ICONS, setPanelOpen, useModeStore, type Role } from './role'
import {
  godStories,
  nearestGoal,
  observerStories,
  pickStories,
  StoryWatch,
  type Shown,
  type Story,
} from './stories'

/** How often the rows are worked out again. */
const REFRESH_MS = 2000

interface Props {
  world: WorldState
  role: Role
  onAnswer: (prayer: PrayerInfo) => void
  onTool: (toolId: string, at: { x: number; y: number }) => void
}

/**
 * The map's top-left corner. On a wide screen the world drawer slides over the
 * map from the left (pixel-theme.css), so the panel moves right of it.
 */
function useMapCorner(): { top: number; left: number } {
  const leftOpen = useUIStore((s) => s.leftOpen)
  const [corner, setCorner] = useState({ top: 56, left: 10 })
  useLayoutEffect(() => {
    const main = document.querySelector('main.main')
    const measure = () => {
      const box = main?.getBoundingClientRect()
      const drawer = document.querySelector<HTMLElement>('.panel-left')
      const beside = leftOpen && drawer && window.innerWidth >= 768 ? drawer.offsetWidth : 0
      setCorner({ top: Math.round((box?.top ?? 46) + 10), left: Math.round((box?.left ?? 0) + beside + 10) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (main) observer.observe(main)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [leftOpen])
  return corner
}

export function StoryPanel({ world, role, onAnswer, onTool }: Props) {
  const open = useModeStore((s) => s.panelOpen[role])
  const hideUI = useViewFlag('hideUI')
  const photoMode = useViewFlag('photoMode')
  const scene = useCurrentScene()
  const corner = useMapCorner()
  const [rows, setRows] = useState<Shown[]>([])
  const watch = useRef(new StoryWatch())
  const worldRef = useRef(world)

  useEffect(() => {
    worldRef.current = world
    watch.current.update(world)
  }, [world])

  useEffect(() => {
    const refresh = () => {
      const now = worldRef.current
      const stories = role === 'god' ? godStories(now) : observerStories(now, watch.current)
      setRows((prev) => pickStories(prev, stories, Date.now()))
    }
    setRows([])
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [role])

  if (hideUI || photoMode || scene) return null

  const icon = ROLE_ICONS[role]
  const title = role === 'god' ? t('modes.panel.god') : t('modes.panel.observer')
  const style = { top: corner.top, left: corner.left }

  if (!open) {
    return (
      <button
        type="button"
        className="fork-mode-chip"
        style={style}
        data-tour="mode-panel"
        aria-label={t('modes.panel.expandAria')}
        onClick={() => setPanelOpen(role, true)}
      >
        <ToolSprite icon={icon} size={14} />
        <span>{title}</span>
        {rows.length > 0 && <span className="fork-mode-count">{rows.length}</span>}
      </button>
    )
  }

  const act = (story: Story) => {
    const { action } = story
    if (action.kind === 'prayer') {
      onAnswer(action.prayer)
      return
    }
    if (action.kind === 'tool' && story.at) {
      onTool(action.tool, { x: Math.round(story.at.x), y: Math.round(story.at.y) })
    } else if (story.at) {
      useCameraFocus.getState().focusTile(Math.round(story.at.x), Math.round(story.at.y))
    }
    const ui = useUIStore.getState()
    if (story.person) ui.selectOrg(story.person)
    else if (story.lineage) ui.setFocus(`lineage:${story.lineage}`)
  }

  const goal = role === 'god' ? nearestGoal(world.goals) : null

  return (
    <section
      className={clsx('fork-mode-panel', role)}
      style={style}
      data-tour="mode-panel"
      aria-label={title}
    >
      <header className="fork-mode-head">
        <ToolSprite icon={icon} size={14} />
        <span className="fork-mode-title">{title}</span>
        {role === 'observer' && (
          <span className="fork-mode-year">
            {t('modes.panel.year', { year: calendarAt(world.tick).year })}
          </span>
        )}
        <button
          type="button"
          className="fork-mode-fold"
          aria-label={t('modes.panel.collapseAria')}
          onClick={() => setPanelOpen(role, false)}
        >
          {t('modes.panel.collapse')} ▴
        </button>
      </header>
      {rows.length === 0 ? (
        <div className="fork-mode-quiet">
          {role === 'god' ? t('modes.panel.quietGod') : t('modes.panel.quiet')}
        </div>
      ) : (
        <ul className="fork-mode-rows">
          {rows.map(({ story }) => (
            <li key={story.key} className={clsx('fork-mode-row', story.kind)}>
              <ToolSprite icon={story.icon} size={18} />
              <div className="fork-mode-text">
                <div className="fork-mode-row-title">{story.title}</div>
                {story.detail && <div className="fork-mode-row-detail">{story.detail}</div>}
              </div>
              {(story.at || story.action.kind === 'prayer') && (
                <button
                  type="button"
                  className={clsx('lang-btn', story.action.kind !== 'show' && 'primary')}
                  onClick={() => act(story)}
                >
                  {story.action.kind === 'prayer'
                    ? t('modes.action.answer')
                    : story.action.kind === 'tool'
                      ? t('modes.action.help')
                      : t('modes.action.show')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <footer className="fork-mode-foot">
        {role === 'god' ? (
          <>
            <span>
              {goal
                ? t('modes.panel.goal', {
                    goal: goalTitle(goal),
                    progress: goal.progress,
                    target: goal.target,
                  })
                : ''}
            </span>
            <button
              type="button"
              className="fork-mode-link"
              onClick={() => useUIStore.getState().openGoals()}
            >
              {t('modes.panel.goals')}
            </button>
          </>
        ) : (
          <>
            <span>{t('modes.panel.live')}</span>
            <button
              type="button"
              className="fork-mode-link"
              onClick={() => useUIStore.getState().openChronicles()}
            >
              {t('modes.panel.chronicles')}
            </button>
          </>
        )}
      </footer>
    </section>
  )
}
