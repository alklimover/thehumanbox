// Types for merge-locale-json.mjs, for its vitest check in apps/web/src/fork/i18n.
export type LocaleTree = { [key: string]: string | LocaleTree }
export function mergeLocale(sides: {
  base: LocaleTree
  ours: LocaleTree
  theirs: LocaleTree
  enBase: LocaleTree
  enTheirs: LocaleTree
}): { tree: LocaleTree; kept: [string, 'both' | 'en-changed'][] }
