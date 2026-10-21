// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleForTests } from '../i18n/locale'
import { bootStage, initialStage, installBootStages } from './boot-stages'

beforeEach(() => {
  document.body.innerHTML =
    '<div id="thb-splash"><div class="thb-sub" id="thb-progress-text">мир просыпается…</div></div>'
  setLocaleForTests('ru')
})
afterEach(() => {
  setLocaleForTests('en')
  vi.useRealTimers()
})

const text = () => document.getElementById('thb-progress-text')?.textContent

describe('loading screen steps', () => {
  it('knows the first step from the page alone', () => {
    expect(initialStage(true, '', 'server')).toBe('sim')
    expect(initialStage(true, '?api=127.0.0.1:4000', 'server')).toBe('connecting')
    expect(initialStage(false, '', 'wasm')).toBeNull()
  })

  it('names each step, the download and the seconds', () => {
    vi.useFakeTimers()
    installBootStages()
    bootStage('reading')
    expect(text()).toBe('читаю сохранённый мир…')
    bootStage('restoring', 12345)
    expect(text()).toMatch(/^восстанавливаю мир · такт 12\s345$/)
    bootStage('no-such-step')
    expect(text()).toMatch(/^восстанавливаю/)
    window.dispatchEvent(new CustomEvent('thb-snapshot-progress', { detail: { loaded: 10, total: 10 } }))
    expect(text()).toBe('рисую мир…')
    vi.advanceTimersByTime(5000)
    expect(document.querySelector('.thb-elapsed')?.textContent).toBe('5 с')
  })
})
