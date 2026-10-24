// Fork: where the important-moment card stands. It belongs at the top centre,
// but the mode panel (fork/modes/StoryPanel.tsx) holds the top-left corner and
// widens with the window and the world drawer; the card moves right of it,
// narrows, and on a window too small for both goes under it.
import { useEffect, useState } from 'react'

export interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

export interface Placement {
  left: number
  top: number
  width: number
}

export const CARD = { max: 520, min: 320, margin: 16, gap: 12, top: 56 }

/** The card's place in a window `viewport` px wide, clear of `panel` (the mode panel's box, if shown). */
export function cardPlacement(viewport: number, panel: Box | null, top = CARD.top): Placement {
  const width = Math.max(0, Math.min(CARD.max, viewport - 2 * CARD.margin))
  const centred = (viewport - width) / 2
  if (!panel || panel.bottom <= top || panel.right + CARD.gap <= centred) {
    return { left: Math.round(centred), top, width }
  }
  const from = panel.right + CARD.gap
  const room = viewport - CARD.margin - from
  if (room >= CARD.min) {
    const w = Math.min(CARD.max, room)
    return { left: Math.round(Math.max(from, (viewport - w) / 2)), top, width: Math.round(w) }
  }
  return { left: Math.round(centred), top: Math.round(panel.bottom + CARD.gap), width }
}

const PANEL = '.fork-mode-panel, .fork-mode-chip'

function measure(): Placement {
  const el = document.querySelector<HTMLElement>(PANEL)
  const r = el?.getBoundingClientRect()
  const panel = r && r.width > 0 ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : null
  return cardPlacement(window.innerWidth, panel)
}

/** Follows the mode panel while the card is shown (it slides with the drawer and folds to a chip). */
export function useCardPlacement(active: boolean): Placement {
  const [place, setPlace] = useState<Placement>(() => measure())
  useEffect(() => {
    if (!active) return
    const update = () =>
      setPlace((old) => {
        const next = measure()
        return old.left === next.left && old.top === next.top && old.width === next.width ? old : next
      })
    update()
    const timer = window.setInterval(update, 250)
    window.addEventListener('resize', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', update)
    }
  }, [active])
  return place
}
