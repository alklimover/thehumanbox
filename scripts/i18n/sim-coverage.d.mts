// Types for sim-coverage.mjs, for the vitest checks in apps/web/src/fork/i18n/simtext.
import type { CatalogEntry } from './extract-sim-strings.mjs'
export function makeMatcher(
  entries: CatalogEntry[],
): (text: string) => { how: 'literal' | 'template' | 'word' | 'compose'; entries: CatalogEntry[] } | null
