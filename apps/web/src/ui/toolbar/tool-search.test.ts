import { describe, expect, it, vi } from 'vitest'
import { searchWorldTools } from './tool-search'
import { SANDBOX_CATEGORIES } from '../../simulation/sandbox'

describe('searchable world tools', () => {
  it('makes the entire existing catalogue discoverable without duplicate commands', () => {
    const all = searchWorldTools('')
    expect(all.length).toBe(SANDBOX_CATEGORIES.reduce((count, category) => count + category.tools.length, 0))
    expect(new Set(all.map(({ tool }) => tool.id)).size).toBe(all.length)
  })
  it('matches category and tool words together, ignoring case and whitespace', () => {
    expect(searchWorldTools(' HELPFUL   heal ')[0].tool.id).toBe('heal')
    expect(searchWorldTools('terrain water').some(({ tool }) => tool.id === 'water')).toBe(true)
  })
  it('does not offer invented commands for unmatched requests', () => {
    expect(searchWorldTools('teleport planet')).toEqual([])
  })
  it('ranks a tool whose label is the word above one that only mentions it in its tip', () => {
    const ids = searchWorldTools('water').map(({ tool }) => tool.id)
    expect(ids[0]).toBe('water')
  })
  it('finds a tool by what its tip says, not only its name', () => {
    const ids = searchWorldTools('shade').map(({ tool }) => tool.id)
    expect(ids).toContain('plant_mushroom')
  })
})

describe('searching in Russian', () => {
  // The tool names are read once when the catalogue loads, so load it afresh in Russian.
  async function russianSearch() {
    vi.resetModules()
    const i18n = await import('../../i18n')
    await i18n.loadLocale('ru')
    const { searchWorldTools: search } = await import('./tool-search')
    return search
  }

  it('finds a tool by its Russian name', async () => {
    const search = await russianSearch()
    expect(search('вода')[0].tool.id).toBe('water')
    expect(search('ландшафты лес')[0].tool.id).toBe('biome_forest')
  })

  it('still finds a tool by its English name or id', async () => {
    const search = await russianSearch()
    expect(search('water')[0].tool.id).toBe('water')
    expect(search('helpful heal')[0].tool.id).toBe('heal')
    expect(search('meteor_shower')[0].tool.id).toBe('meteor_shower')
  })

  it('reads е and ё as one letter', async () => {
    const search = await russianSearch()
    expect(search('костер')[0].tool.id).toBe('campfire')
  })
})
