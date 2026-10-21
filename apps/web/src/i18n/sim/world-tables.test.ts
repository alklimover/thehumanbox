import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../locale'
import { simLabel, simLabelAsSent } from '.'
import { SIM_TABLES, type SimDomain } from './tables'
import { milestoneDescription } from './milestone'

const SIM = '../../../../../crates/sim-core/src/sim/'

function rust(path: string): string {
  return readFileSync(new URL(SIM + path, import.meta.url), 'utf8')
}

/** The strings a `match` arm returns for `Enum::Variant => "name"` in one Rust file. */
function names(path: string, enumName: string): string[] {
  const pattern = new RegExp(`${enumName}::\\w+ => "([^"]+)"`, 'g')
  return [...rust(path).matchAll(pattern)].map((match) => match[1])
}

function eraNames(): string[] {
  const dir = new URL(SIM + 'civ/progress/eras/', import.meta.url)
  return readdirSync(dir)
    .filter((file) => file.endsWith('.rs') && file !== 'mod.rs' && file !== 'flavour.rs')
    .map((file) => /name: "([^"]+)"/.exec(readFileSync(new URL(file, dir), 'utf8'))?.[1] ?? file)
}

const WORLD_TABLES: SimDomain[] = [
  'era',
  'building',
  'buildingFunction',
  'discovery',
  'specialty',
  'good',
  'government',
  'law',
  'disease',
  'treaty',
  'settlement',
  'strategy',
  'milestone',
]

const missing = (domain: SimDomain, ids: string[]) => ids.filter((id) => !(id in SIM_TABLES[domain]))

afterEach(() => setLocaleForTests('en'))

describe('world and economy names', () => {
  it('give every entry a Russian name', () => {
    for (const domain of WORLD_TABLES) {
      for (const [id, name] of Object.entries(SIM_TABLES[domain])) {
        expect(name.ru.trim(), `${domain}.${id}`).not.toBe('')
      }
    }
  })

  it('name all 45 eras of the ladder', () => {
    const eras = eraNames()
    expect(eras).toHaveLength(45)
    expect(missing('era', eras)).toEqual([])
  })

  it('cover the ids the simulation sends', () => {
    const buildings = names('tech/buildings/kind.rs', 'BuildingKind')
    expect(buildings.length).toBeGreaterThan(150)
    expect(missing('building', buildings)).toEqual([])
    expect(missing('discovery', buildings)).toEqual([])
    expect(missing('buildingFunction', names('tech/buildings/profile.rs', 'BuildingFunction'))).toEqual([])
    expect(missing('specialty', names('civ/society/economy.rs', 'Specialty'))).toEqual([])
    expect(missing('government', names('civ/society/government.rs', 'GovernmentKind'))).toEqual([])
    expect(missing('law', names('civ/society/government.rs', 'LawKind'))).toEqual([])
    expect(missing('disease', names('tech/medicine.rs', 'DiseaseKind'))).toEqual([])
    expect(missing('treaty', names('civ/society/warfare/types.rs', 'TreatyKind'))).toEqual([])
    expect(missing('good', names('tech/tools.rs', 'ToolKind'))).toEqual([])
    expect(missing('good', names('tech/agriculture.rs', 'CropKind'))).toEqual([])
    expect(missing('good', names('tech/transportation.rs', 'TransportKind'))).toEqual([])
    const milestoneSource = rust('civ/progress/world_milestones.rs')
    const milestoneNames = milestoneSource.slice(0, milestoneSource.indexOf('fn description('))
    const milestones = [...milestoneNames.matchAll(/Milestone::\w+ => "([^"]+)"/g)].map((m) => m[1])
    expect(milestones).toHaveLength(42)
    expect(missing('milestone', milestones)).toEqual([])
    const tiers = /TIER_NAMES[^=]*=\s*\[([^\]]*)\]/.exec(rust('civ/society/settlements.rs'))?.[1] ?? ''
    expect(
      missing(
        'settlement',
        [...tiers.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
      ),
    ).toEqual([])
    const techNames = [...rust('tech/tech_tree/ancient.rs').matchAll(/name: "([^"]+)"/g)].map((m) => m[1])
    expect(missing('discovery', techNames)).toEqual([])
  })

  it('keep each milestone line word for word', () => {
    const source = rust('civ/progress/world_milestones.rs')
    const descriptions = source.slice(source.indexOf('fn description('))
    for (const [id, line] of Object.entries(milestoneDescription)) {
      expect(descriptions, id).toContain(`"${line.en}"`)
      expect(line.ru.trim(), id).not.toBe('')
    }
  })

  it('show the prettified id in English and the Russian name in Russian', () => {
    expect(simLabel('era', 'pre-stone')).toBe('pre stone')
    expect(simLabel('building', 'train_station')).toBe('train station')
    setLocaleForTests('ru')
    expect(simLabel('era', 'bronze')).toBe('бронзовый век')
    expect(simLabel('era', 'kardashev-2')).toBe('цивилизация II типа')
    expect(simLabel('building', 'forge')).toBe('кузница')
    expect(simLabel('discovery', 'granary')).toBe('амбар')
  })

  it('keep the era id as sent where English always printed it raw', () => {
    // Header chip, footer, civilization and stats tables showed "pre-stone", not "pre stone".
    expect(simLabelAsSent('era', 'pre-stone')).toBe('pre-stone')
    expect(simLabelAsSent('era', 'kardashev-2')).toBe('kardashev-2')
    expect(simLabelAsSent('era', 'bronze')).toBe('bronze')
    expect(simLabelAsSent('era', 'not-an-era')).toBe('not-an-era')
    expect(simLabelAsSent('era', null)).toBe('')
    setLocaleForTests('ru')
    expect(simLabelAsSent('era', 'pre-stone')).toBe('докаменный век')
    expect(simLabelAsSent('era', 'kardashev-2')).toBe('цивилизация II типа')
  })
})
