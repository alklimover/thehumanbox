// The people-and-language tables must name every id the simulation can send.
// The ids are read from the Rust sources at test time, so a new concept,
// attribute or death cause in the simulation fails here until it is translated.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { CATALOGS } from '../catalog'
import { setLocaleForTests } from '../locale'
import { simLabel } from '.'
import { SIM_TABLES } from './tables'
import { CONVERSATION_GLOSS } from './concept'

afterEach(() => setLocaleForTests('en'))

function rust(path: string): string {
  return readFileSync(new URL(`../../../../../../crates/sim-core/src/${path}`, import.meta.url), 'utf8')
}

/** The source text from `start` up to the first `end` after it. */
function block(source: string, start: string, end: string): string {
  const from = source.indexOf(start)
  expect(from, start).toBeGreaterThanOrEqual(0)
  const to = source.indexOf(end, from + start.length)
  expect(to, end).toBeGreaterThan(from)
  return source.slice(from + start.length, to)
}

/** Every string literal in a piece of Rust, comments left out. */
function strings(source: string): string[] {
  const code = source.replace(/\/\/[^\n]*/g, '')
  return [...code.matchAll(/"([^"\\]*)"/g)].map((m) => m[1])
}

/** The right-hand strings of `X => "id"` match arms. */
function armValues(source: string): string[] {
  return [...source.matchAll(/=>\s*"([^"]*)"/g)].map((m) => m[1])
}

function expectCovers(domain: keyof typeof SIM_TABLES, ids: string[]) {
  const table = SIM_TABLES[domain]
  const missing = [...new Set(ids)].filter((id) => !(id in table))
  expect(missing, `${domain} misses`).toEqual([])
}

const PEOPLE_TABLES = [
  'concept',
  'attribute',
  'zodiac',
  'aspiration',
  'mood',
  'personality',
  'ageStage',
  'deathCause',
  'religion',
  'animal',
] as const

const CONCEPTS = strings(block(rust('organism/vocabulary.rs'), 'pub const CONCEPTS: &[&str] = &[', '];'))

describe('people and language tables', () => {
  it('reads the full concept list from the simulation', () => {
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(417)
    expect(new Set(CONCEPTS).size).toBe(CONCEPTS.length)
  })

  it('names every vocabulary concept, and nothing else', () => {
    expectCovers('concept', CONCEPTS)
    const extra = Object.keys(SIM_TABLES.concept).filter((id) => !CONCEPTS.includes(id))
    expect(extra).toEqual([])
  })

  it('gives every entry a Russian name of its own', () => {
    for (const domain of PEOPLE_TABLES) {
      for (const [id, name] of Object.entries(SIM_TABLES[domain])) {
        expect(name.ru.trim(), `${domain}.${id}`).not.toBe('')
        expect(name.ru, `${domain}.${id}`).not.toMatch(/[a-z]/i)
      }
    }
  })

  it('keeps concepts to one or two words', () => {
    for (const [id, name] of Object.entries(SIM_TABLES.concept)) {
      expect(name.ru.split(/[\s,]+/).length, id).toBeLessThanOrEqual(2)
    }
  })

  it('maps conversation glosses back to the concepts the simulation glossed', () => {
    const gloss = block(rust('sim/agents/courtship.rs'), 'fn concept_gloss(', '_ => "something"')
    for (const [text, id] of Object.entries(CONVERSATION_GLOSS)) {
      expect(gloss, `${id} → ${text}`).toContain(`"${id}" => "${text}"`)
      expect(SIM_TABLES.concept[id], id).toBeDefined()
    }
    // Every concept a conversation can speak is glossed here.
    const spoken = block(rust('sim/agents/courtship.rs'), 'fn utterance_with_meaning(', 'fn mood_arc(')
    const used = [...spoken.matchAll(/pick_concept_and_word\([^,]+,\s*&\[([^\]]*)\]/g)].flatMap((m) =>
      strings(m[1]),
    )
    expect(used.length).toBeGreaterThan(0)
    expect(used.filter((id) => !Object.values(CONVERSATION_GLOSS).includes(id))).toEqual([])
  })

  it('names every attribute a person can carry', () => {
    const source = rust('organism/attributes.rs')
    const ids = [
      ...strings(block(source, 'pub const INHERITABLE_PHYSICAL: &[&str] = &[', '];')),
      ...strings(block(source, 'pub const INHERITABLE_PERSONALITY: &[&str] = &[', '];')),
      ...strings(block(source, 'pub const BIRTH_ATTRS_COMMON: &[(&str, f32)] = &[', '];')),
      ...[...source.matchAll(/insert\("([^"]+)"/g)].map((m) => m[1]),
      // The words chosen by sex before `attrs.insert(l.into())`.
      ...[...source.matchAll(/^\s*"([a-z-]+)"\s*$/gm)].map((m) => m[1]),
      ...strings(block(rust('sim/command/miracles.rs'), 'const TALENTS: [&str; 4] = [', '];')),
    ]
    expect(ids.length).toBeGreaterThan(190)
    expectCovers('attribute', ids)
    // Markers other systems leave in the same set (the card shows them too).
    const markers = [
      'sim/civ/civ_tick/people.rs',
      'sim/civ/moments/relationships.rs',
      'sim/civ/moments/sky.rs',
      'sim/simulation/animals.rs',
    ].flatMap((path) => [...rust(path).matchAll(/attributes\s*\.insert\("([^"]+)"/g)].map((m) => m[1]))
    expect(markers).toContain('left_home')
    expectCovers('attribute', markers)
    const strategies = [...rust('sim/simulation/strategy.rs').matchAll(/^\s*"(\w+)" => "/gm)].map((m) => m[1])
    expect(strategies.length).toBeGreaterThan(0)
    expectCovers(
      'attribute',
      strategies.map((s) => `campaign:${s}`),
    )
  })

  it('names the twelve signs, the age stages, moods and personality words', () => {
    const cosmos = rust('sim/cosmos.rs')
    const signs = armValues(block(cosmos, 'impl ZodiacSign {', 'pub fn glyph'))
    expect(signs).toHaveLength(12)
    expectCovers('zodiac', signs)

    const stages = armValues(block(rust('sim/agents/age_stage.rs'), 'pub fn name(self)', '\n    }\n'))
    expect(stages).toHaveLength(5)
    expectCovers('ageStage', stages)

    const moods = strings(block(rust('organism/organism/mood.rs'), 'pub fn mood(&self)', '#[cfg(test)]'))
    expect(moods).toHaveLength(8)
    expectCovers('mood', moods)

    const words = strings(block(rust('organism/personality.rs'), 'pub fn personality_words', '#[cfg(test)]'))
    expect(words).toHaveLength(5)
    expectCovers('personality', words)
  })

  it('names every aspiration', () => {
    const roles = strings(
      block(rust('sim/civ/civ_tick/people.rs'), "let pick: &'static str = if", 'let o_mut'),
    )
    expect(roles).toHaveLength(10)
    expectCovers('aspiration', roles)
    const hopes = strings(block(rust('sim/civ/moments/mood.rs'), 'let aspirations = [', '];'))
    expect(hopes).toHaveLength(8)
    expectCovers('aspiration', hopes)
  })

  it('names every cause of death', () => {
    const mortality = rust('sim/simulation/organism_tick/mortality.rs')
    const harms = block(mortality, 'let cause = match harm {', 'noted = Some(')
    const causes = [
      ...[...harms.matchAll(/^\s*"([a-z ]+)"\s*$/gm)].map((m) => m[1]),
      ...[...mortality.matchAll(/death_cause = "([^"]+)"/g)].map((m) => m[1]),
      ...[...rust('sim/civ/society/warfare/battles.rs').matchAll(/death_cause = "([^"]+)"/g)].map(
        (m) => m[1],
      ),
    ]
    expect(causes).toContain('old age')
    expect(causes.length).toBeGreaterThanOrEqual(12)
    expectCovers('deathCause', causes)
  })

  it('names every religion kind and founding name', () => {
    const culture = rust('sim/civ/society/culture.rs')
    const names = strings(block(culture, 'pub const RELIGION_NAMES: &[&str] = &[', '];'))
    expect(names).toHaveLength(16)
    expectCovers('religion', names)
    const kinds = armValues(block(culture, 'impl ReligionKind {', 'pub fn era_unlock'))
    expect(kinds).toHaveLength(5)
    expectCovers('religion', kinds)
  })

  it('names every animal, with the dock’s Russian names', () => {
    const animal = rust('organism/animal.rs')
    const kinds = armValues(block(animal, "pub fn name(self) -> &'static str {", '\n    }\n'))
    expect(kinds.length).toBeGreaterThanOrEqual(36)
    expectCovers('animal', kinds)
    for (const kind of kinds) {
      const dock = CATALOGS.ru[`tools.label.${kind}`]
      if (dock !== undefined) expect(SIM_TABLES.animal[kind].ru, kind).toBe(dock)
    }
  })

  it('shows in English what the game showed before', () => {
    expect(simLabel('concept', 'blood-kin')).toBe('blood-kin')
    expect(simLabel('concept', 'fire')).toBe('fire')
    expect(simLabel('attribute', 'short-statured')).toBe('short-statured')
    expect(simLabel('attribute', 'milestone:elder_headline:pending')).toBe('milestone:elder_headline:pending')
    expect(simLabel('animal', 'polar_bear')).toBe('polar_bear')
    expect(simLabel('deathCause', 'old age')).toBe('old age')
    expect(simLabel('religion', 'Sun Path')).toBe('Sun Path')
    // The person card, the language table and the stats print these ids raw,
    // so each one reads as itself in English. The only exceptions are the two
    // trait fields the trait averages print with a space.
    const spaced = new Set(['memory_strength', 'social_tendency'])
    for (const domain of PEOPLE_TABLES) {
      for (const id of Object.keys(SIM_TABLES[domain])) {
        const shown = spaced.has(id) ? id.replace('_', ' ') : id
        expect(simLabel(domain, id), `${domain}.${id}`).toBe(shown)
      }
    }
  })

  it('shows the Russian names', async () => {
    await setLocaleForTests('ru')
    expect(simLabel('concept', 'fire')).toBe('огонь')
    expect(simLabel('deathCause', 'old age')).toBe('старость')
    expect(simLabel('animal', 'polar_bear')).toBe('белый медведь')
  })

  it('has the flavour line of every sign and the tip of every aspiration role', () => {
    const flavor = block(rust('sim/cosmos.rs'), 'impl ZodiacSign {', 'pub fn from_birth_tick')
    for (const sign of Object.keys(SIM_TABLES.zodiac)) {
      const en = CATALOGS.en[`people.zodiacFlavor.${sign}`]
      expect(en, sign).toBeDefined()
      expect(flavor, sign).toContain(`"${en as string}"`)
    }
    const roles = Object.keys(SIM_TABLES.aspiration).filter((id) => !id.includes(' '))
    expect(roles).toHaveLength(10)
    for (const role of roles) expect(CATALOGS.ru[`people.aspirationTip.${role}`], role).toBeDefined()
  })
})
