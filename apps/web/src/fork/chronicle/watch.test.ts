import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RULES,
  alsoShown,
  defaultSettings,
  differs,
  focusedTribe,
  readSettings,
  type AlertLine,
  type ServerWatch,
  type WatchAlert,
} from './watch'

function line(tick: number): AlertLine {
  return {
    tick,
    src: 'event',
    kind: 'war_declared',
    cat: 'war',
    actor: 'aaaa1111',
    text: 'aaaa1111 declared war on bbbb2222 over the border at (1,2)',
    era: 'iron',
    tribes: [],
    rule: 'war',
  }
}

function serverOf(focus: string | null = null): ServerWatch {
  const s = defaultSettings()
  return { enabled: s.enabled, debounce_secs: s.debounceSecs, rules: { ...s.rules }, focus }
}

describe('the choices', () => {
  it('are on by default, pause on world and focused eras and dying tribes, slow on wars, a minute apart', () => {
    const s = defaultSettings()
    expect(s.enabled).toBe(true)
    expect(s.debounceSecs).toBe(60)
    expect(s.rules.world_era).toBe('pause')
    expect(s.rules.focus_era).toBe('pause')
    expect(s.rules.died_out).toBe('pause')
    expect(s.rules.tribe_era).toBe('ignore')
    expect(s.rules.war).toBe('slow')
    expect(s.rules.epidemic).toBe('ignore')
  })

  it('match the simulation’s defaults, rule by rule', () => {
    const rust = readFileSync(join(__dirname, '../../../../server/src/fork_chronicle/watch.rs'), 'utf8')
    const block = rust.slice(rust.indexOf('pub(crate) const RULES'), rust.indexOf('];'))
    const server = [...block.matchAll(/\("(\w+)", Action::(\w+)\)/g)].map((m) => [m[1], m[2].toLowerCase()])
    expect(server).toEqual(RULES.map(([rule, action]) => [rule, action]))
    expect(rust).toContain('const DEFAULT_DEBOUNCE: u64 = 60;')
  })

  it('read back only what is valid', () => {
    const stored = JSON.stringify({
      enabled: false,
      debounceSecs: 45,
      rules: { war: 'pause', world_era: 'explode', bogus: 'pause' },
    })
    const s = readSettings({ getItem: () => stored })
    expect(s.enabled).toBe(false)
    expect(s.debounceSecs).toBe(60)
    expect(s.rules.war).toBe('pause')
    expect(s.rules.world_era).toBe('pause')
    expect('bogus' in s.rules).toBe(false)
    expect(readSettings({ getItem: () => '{nope' })).toEqual(defaultSettings())
    expect(readSettings(null)).toEqual(defaultSettings())
  })

  it('are sent again when the simulation holds others (it restarts with the defaults)', () => {
    const s = defaultSettings()
    expect(differs(serverOf(), s, null)).toBe(false)
    expect(differs(undefined, s, null)).toBe(true)
    expect(differs(serverOf(), s, 'aaaa1111')).toBe(true)
    expect(differs(serverOf(), { ...s, enabled: false }, null)).toBe(true)
    expect(differs(serverOf(), { ...s, debounceSecs: 180 }, null)).toBe(true)
    expect(differs(serverOf(), { ...s, rules: { ...s.rules, war: 'pause' } }, null)).toBe(true)
  })
})

describe('the card', () => {
  it('shows a few of the lines held back and counts the rest', () => {
    const alert: WatchAlert = {
      id: 1,
      tick: 5,
      action: 'slow',
      prev_speed: 50,
      main: line(5),
      also: [line(4), line(3), line(2), line(1), line(0)],
      also_total: 9,
      focus: null,
    }
    const { lines, more } = alsoShown(alert)
    expect(lines.map((l) => l.tick)).toEqual([4, 3, 2, 1])
    expect(more).toBe(5)
    expect(alsoShown({ ...alert, also: [], also_total: 0 })).toEqual({ lines: [], more: 0 })
  })

  it('knows the tribe in focus: a focused tribe, or the selected person’s', () => {
    const people = [{ id: 'p1', lineage_id: 'aaaa1111' }]
    expect(focusedTribe('lineage:bbbb2222', 'p1', people)).toBe('bbbb2222')
    expect(focusedTribe('all', 'p1', people)).toBe('aaaa1111')
    expect(focusedTribe('all', null, people)).toBeNull()
    expect(focusedTribe('all', 'gone', people)).toBeNull()
  })
})
