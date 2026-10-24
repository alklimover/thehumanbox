import { describe, expect, it } from 'vitest'
import { CARD, cardPlacement, type Box } from './placement'

/** The mode panel as StoryPanel.tsx places it: left of the map plus the drawer, its CSS width. */
function panel(viewport: number, drawer = 0, height = 300): Box {
  const left = 10 + drawer
  const width =
    viewport < 768 ? Math.min(340, viewport - 24) : Math.min(340, Math.max(260, viewport / 2 - 150))
  return { left, right: left + width, top: 56, bottom: 56 + height }
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

function box(viewport: number, p: Box | null, height = 260): Box {
  const c = cardPlacement(viewport, p)
  return { left: c.left, right: c.left + c.width, top: c.top, bottom: c.top + height }
}

describe('the card beside the mode panel', () => {
  it('stands at the top centre when nothing is in the way', () => {
    expect(cardPlacement(1440, null)).toEqual({ left: 460, top: CARD.top, width: 520 })
    expect(cardPlacement(1440, panel(1440))).toEqual({ left: 460, top: CARD.top, width: 520 })
  })

  it('never covers the panel, from a phone to a wide screen, with the drawer open or shut', () => {
    for (let viewport = 360; viewport <= 2560; viewport += 8) {
      for (const drawer of [0, 280]) {
        const p = panel(viewport, viewport >= 768 ? drawer : 0)
        const c = box(viewport, p)
        expect(overlaps(c, p), `${viewport}px, drawer ${drawer}`).toBe(false)
        expect(c.left).toBeGreaterThanOrEqual(0)
        expect(c.right).toBeLessThanOrEqual(viewport)
      }
    }
  })

  it('moves right and narrows at 1024 px, and goes under the panel when there is no room', () => {
    const at1024 = cardPlacement(1024, panel(1024))
    expect(at1024.left).toBeGreaterThanOrEqual(panel(1024).right + CARD.gap)
    expect(at1024.top).toBe(CARD.top)
    expect(at1024.width).toBeGreaterThanOrEqual(CARD.min)
    const phone = cardPlacement(390, panel(390))
    expect(phone.top).toBe(panel(390).bottom + CARD.gap)
  })

  it('ignores a folded panel that ends above it', () => {
    const chip: Box = { left: 10, right: 400, top: 10, bottom: 40 }
    expect(cardPlacement(1024, chip).left).toBe(252)
  })
})
