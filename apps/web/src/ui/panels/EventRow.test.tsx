// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { EventRow } from './EventRow'
import { setLocaleForTests } from '../../i18n/locale'

beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true))
afterAll(() => vi.unstubAllGlobals())
const roots: Root[] = []
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()))
  document.body.innerHTML = ''
  setLocaleForTests('en')
})

function tickShown(tick: number): string | null | undefined {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(<EventRow event={{ tick, type: 'born', actor: 'A', detail: 'is born' }} />))
  return host.querySelector('.event-tick')?.textContent
}

describe('EventRow', () => {
  it('groups the digits of the tick for the player’s language', () => {
    expect(tickShown(12345)).toBe('12,345')
    setLocaleForTests('ru')
    expect(tickShown(12345)).toBe('12\u00a0345')
  })
})
