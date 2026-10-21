// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { onSimLabelMiss, simLabel } from '../sim'
import { startI18nCheck } from './detector'

beforeAll(() => {
  vi.spyOn(console, 'table').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  startI18nCheck()
})

afterAll(() => {
  onSimLabelMiss(null)
  vi.restoreAllMocks()
})

function press(code: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, altKey: true, shiftKey: true }))
}

describe('startI18nCheck', () => {
  it('reports interface text and simulation ids with no Russian name', () => {
    document.body.innerHTML = '<button>start</button><span class="event-detail">a storm passed</span>'
    simLabel('building', 'quantum_forge')
    simLabel('building', 'quantum_forge')
    simLabel('era', 'genesis')
    const rows = window.__i18nReport!()
    expect(rows.map((r) => [r.kind, r.text, r.count])).toEqual([
      ['sim-label', 'building: quantum_forge', 2],
      ['ui', 'start', 1],
    ])
    expect(window.__i18nReport!({ sim: true }).map((r) => r.text)).toContain('a storm passed')
    expect(JSON.parse(window.__i18nReport!.json())).toHaveLength(2)
  })

  it('toggles the highlight and simulation text from the keyboard', () => {
    const root = document.documentElement
    expect(root.hasAttribute('data-i18n-highlight')).toBe(false)
    press('KeyI')
    expect(root.hasAttribute('data-i18n-highlight')).toBe(true)
    press('KeyS')
    expect(root.hasAttribute('data-i18n-show-sim')).toBe(true)
    expect(window.__i18nReport!().some((r) => r.kind === 'sim-text')).toBe(true)
    press('KeyI')
    press('KeyS')
    expect(root.hasAttribute('data-i18n-highlight')).toBe(false)
    expect(document.getElementById('thb-i18n-check')?.textContent).toContain('[data-i18n-en="ui"]')
  })
})
