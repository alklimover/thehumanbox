import { CATALOGS } from '../../i18n/catalog'
import { SANDBOX_CATEGORIES, type SandboxTool } from '../../simulation/sandbox'
import { toolTip } from './tool-tips'

/** Lower case, with ё read as е: Russian players often type one for the other. */
function fold(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е')
}

/** The English text of a catalog key, so a tool is found by its English name in any language. */
function english(key: string): string {
  const message = CATALOGS.en[key]
  if (message === undefined) return ''
  return typeof message === 'string' ? message : message.other
}

interface Searchable {
  /** The tool's name, shown and English, split into words. */
  labelWords: string[]
  /** Names, id and group, shown and English, for a looser match. */
  names: string
  /** What the tool does, shown and English. */
  tips: string
}

function searchable(tool: SandboxTool, categoryId: string, category: string): Searchable {
  const labels = [fold(tool.label), fold(english(`tools.label.${tool.id}`))].filter(Boolean)
  const groups = [fold(category), fold(english(`tools.group.${categoryId}`))]
  return {
    labelWords: labels.flatMap((label) => label.split(/\s+/)),
    names: [...labels, tool.id.toLowerCase(), ...groups].join(' '),
    tips: `${fold(toolTip(tool))} ${fold(english(`tools.tip.${tool.id}`))}`,
  }
}

/** How well one query word matches a tool: a label word beats a prefix, a prefix beats a substring. */
function wordScore(word: string, tool: Searchable): number {
  if (tool.labelWords.includes(word)) return 4
  if (tool.labelWords.some((w) => w.startsWith(word))) return 3
  if (tool.names.includes(word)) return 2
  // The tooltip says what a tool does, so "forgive" can find a tool whose tip mentions it.
  if (tool.tips.includes(word)) return 1
  return 0
}

export function searchWorldTools(query: string) {
  const words = fold(query.trim()).split(/\s+/).filter(Boolean)
  const hits = SANDBOX_CATEGORIES.flatMap((category) =>
    category.tools.map((tool) => ({
      category: category.label,
      tool,
      text: searchable(tool, category.id, category.label),
    })),
  ).flatMap((hit) => {
    const scores = words.map((word) => wordScore(word, hit.text))
    if (scores.some((score) => score === 0)) return []
    return [{ ...hit, score: scores.reduce((sum, score) => sum + score, 0) }]
  })
  // Best matches first; the catalogue order breaks ties, so an empty query keeps the dock order.
  return hits.sort((a, b) => b.score - a.score).map(({ category, tool }) => ({ category, tool }))
}
