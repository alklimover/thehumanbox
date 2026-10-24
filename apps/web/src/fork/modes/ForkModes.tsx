// Fork: the observer and god modes on screen (docs/fork/MODES.ru.md). App.tsx
// mounts ForkModes where the welcome card was, and ModePrayerHint where the
// prayer hint was.
import { useEffect, type ComponentProps } from 'react'
import { getDesktop } from '../../shared/desktop'
import type { PrayerInfo, WorldState } from '../../shared/types'
import { useUIStore } from '../../state/store'
import { PrayerHint } from '../../ui/panels/PrayerHint'
import { startModeGuide } from './guide'
import { ModeChoice } from './ModeChoice'
import { chooseRole, loadRole, startScreen, useModeStore, useRole } from './role'
import { StoryPanel } from './StoryPanel'

interface Props {
  world: WorldState
  onAnswer: (prayer: PrayerInfo) => void
  onTool: (toolId: string, at: { x: number; y: number }) => void
}

export function ForkModes({ world, onAnswer, onTool }: Props) {
  const role = useModeStore((s) => s.role)
  const ready = useModeStore((s) => s.ready)
  const pendingGuide = useModeStore((s) => s.pendingGuide)
  const settingsOpen = useUIStore((s) => s.showDesktopSettings)

  useEffect(() => {
    void loadRole(getDesktop())
  }, [])

  // A role taken for the first time brings its tips, once the settings it was taken in are closed.
  useEffect(() => {
    if (pendingGuide && pendingGuide === role && !settingsOpen) startModeGuide(pendingGuide)
  }, [pendingGuide, role, settingsOpen])

  return (
    <>
      {startScreen({ ready, role }) === 'choice' && (
        <ModeChoice onChoose={(r) => chooseRole(r, getDesktop())} />
      )}
      {role && <StoryPanel world={world} role={role} onAnswer={onAnswer} onTool={onTool} />}
    </>
  )
}

/** The one-time prayer hint, for the god only: an observer is not asked to answer prayers. */
export function ModePrayerHint(props: ComponentProps<typeof PrayerHint>) {
  return useRole() === 'observer' ? null : <PrayerHint {...props} />
}
