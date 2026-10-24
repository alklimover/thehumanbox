// Fork: the mode tips, four steps for each role, each pointing at a real part
// of the screen. They replace the general tour and run on its card
// (ui/tour/tour-runner.ts); only the steps are the fork's.
import { t, type MessageKey } from '../../i18n'
import { logger } from '../../shared/logger'
import type { StepDef } from '../../ui/tour/tour-runner'
import { markGuideSeen, setPanelOpen, useModeStore, type Role } from './role'

export const PANEL_SELECTOR = '[data-tour="mode-panel"]'

export interface GuideStep {
  /** What the step points at; when it is not on screen the card stands in the middle. */
  selector: string
  title: MessageKey
  text: MessageKey
  on?: StepDef['on']
}

const STEPS: Record<Role, GuideStep[]> = {
  observer: [
    {
      selector: '[data-tour="world-canvas"]',
      title: 'modes.guide.observer.map.title',
      text: 'modes.guide.observer.map.text',
      on: 'auto',
    },
    {
      selector: PANEL_SELECTOR,
      title: 'modes.guide.observer.panel.title',
      text: 'modes.guide.observer.panel.text',
      on: 'right',
    },
    {
      selector: '.time-control',
      title: 'modes.guide.observer.speed.title',
      text: 'modes.guide.observer.speed.text',
      on: 'top',
    },
    {
      selector: '[data-tour="chronicles-btn"]',
      title: 'modes.guide.observer.history.title',
      text: 'modes.guide.observer.history.text',
      on: 'bottom',
    },
  ],
  god: [
    {
      // The header's prayer chip is there only while someone prays; the bubbles are on the map.
      selector: '.prayer-chip',
      title: 'modes.guide.god.prayers.title',
      text: 'modes.guide.god.prayers.text',
      on: 'bottom',
    },
    {
      selector: PANEL_SELECTOR,
      title: 'modes.guide.god.panel.title',
      text: 'modes.guide.god.panel.text',
      on: 'right',
    },
    {
      selector: '.sandbox-bar',
      title: 'modes.guide.god.powers.title',
      text: 'modes.guide.god.powers.text',
      on: 'top',
    },
    {
      selector: '[data-tour="more-btn"]',
      title: 'modes.guide.god.more.title',
      text: 'modes.guide.god.more.text',
      on: 'bottom',
    },
  ],
}

export function guideSteps(role: Role): readonly GuideStep[] {
  return STEPS[role]
}

/** The steps as the tour card takes them: numbered, and centred where their target is missing. */
export function resolveGuide(role: Role, onScreen: (selector: string) => boolean): StepDef[] {
  const steps = STEPS[role]
  return steps.map((step, i) => {
    const there = onScreen(step.selector)
    return {
      selector: there ? step.selector : '',
      title: t('modes.guide.counter', { n: i + 1, total: steps.length, title: t(step.title) }),
      text: t(step.text),
      on: there ? step.on : undefined,
    }
  })
}

/** Present and not hidden: the header clips chips that do not fit, so the middle of the target must be it. */
function onScreen(selector: string): boolean {
  try {
    const el = document.querySelector(selector)
    if (!el) return false
    const box = el.getBoundingClientRect()
    if (box.width <= 0 || box.height <= 0) return false
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    return !!hit && (el.contains(hit) || hit.contains(el))
  } catch {
    return false
  }
}

/** Shows the tips of a role (the current one by default), with its panel open. */
export function startModeGuide(role: Role | null = useModeStore.getState().role): void {
  if (!role) return
  markGuideSeen(role)
  useModeStore.setState({ pendingGuide: null })
  setPanelOpen(role, true)
  // The panel opens on the next frame; the tour measures it after that.
  window.setTimeout(() => {
    import('../../ui/tour/tour-runner')
      .then((m) => m.runTour('local', resolveGuide(role, onScreen)))
      .catch((error: unknown) => logger.error('modes', 'could not start the tips', error))
  }, 120)
}
