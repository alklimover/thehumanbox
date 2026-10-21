// Every key of the Russian tables must be text the simulation really writes:
// a literal or a template of the extracted catalog (scripts/i18n), or a
// template narrowed to one value ("mentored by elder {org_name}"). A typo, or
// upstream rewording a line, fails here instead of silently showing English.
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extract } from '../../../../../scripts/i18n/extract-sim-strings.mjs'
import { makeMatcher } from '../../../../../scripts/i18n/sim-coverage.mjs'
import { RU_SIM_TEXT_TABLES } from '.'
import { SIM_TABLES } from '../sim/tables'

const ROOT = join(__dirname, '../../../../../crates/sim-core/src')
const { entries } = extract(ROOT, 'crates/sim-core/src')
const match = makeMatcher(entries)

/** A sample of what a key matches: placeholders become a name-like value. */
const sample = (key: string) => key.replace(/\{[A-Za-z_][A-Za-z0-9_]*\}/g, 'Zuvo')

const keys = RU_SIM_TEXT_TABLES.flatMap((t) => Object.keys(t))
const entriesOf = RU_SIM_TEXT_TABLES.flatMap((t) => Object.values(t))
const texts = entriesOf.flatMap((e) =>
  typeof e === 'string' ? [e] : [e.thought, e.event].filter((x) => x !== undefined),
)

describe('Russian simulation text tables', () => {
  it('have every key in the extracted catalog', () => {
    const unknown = keys.filter((k) => !match(sample(k)))
    expect(unknown).toEqual([])
  })

  it('do not repeat a key across tables', () => {
    const seen = new Set<string>()
    const twice = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
    expect(twice).toEqual([])
  })

  it('use only placeholders of their key, and domains that exist', () => {
    const bad: string[] = []
    RU_SIM_TEXT_TABLES.forEach((t) =>
      Object.entries(t).forEach(([key, e]) => {
        const names = new Set([...key.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]))
        const ru = typeof e === 'string' ? e : `${e.thought ?? ''} ${e.event ?? ''}`
        for (const m of ru.matchAll(
          /\{([A-Za-z_][A-Za-z0-9_]*)(?:@([A-Za-z_][A-Za-z0-9_]*))?(?:\|([A-Za-z_]+))?\}/g,
        )) {
          if (!names.has(m[1]) || (m[2] && !names.has(m[2])) || (m[3] && !(m[3] in SIM_TABLES)))
            bad.push(`${key} → ${m[0]}`)
        }
      }),
    )
    expect(bad).toEqual([])
  })

  it('write Russian with balanced gender markup', () => {
    const bad = texts.filter(
      (t) =>
        /[A-Za-z]{3,}/.test(t.replace(/\{[^}]*\}/g, '')) ||
        (t.match(/\[/g)?.length ?? 0) !== (t.match(/\]/g)?.length ?? 0),
    )
    expect(bad).toEqual([])
  })
})
