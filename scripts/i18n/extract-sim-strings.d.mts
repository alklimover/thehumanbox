// Types for extract-sim-strings.mjs, for the vitest checks in apps/web/src/fork/i18n/simtext.
export interface ScannedItem {
  kind: 'literal' | 'template' | 'compose'
  text: string
  line: number
  channel: string | null
  sink: string
  pattern?: string
  placeholders?: string[]
  regex?: string
  textArray?: boolean
}
export interface CatalogEntry {
  channel: string
  kind: 'literal' | 'template' | 'compose' | 'word'
  text: string
  sites: string[]
  sinks: string[]
  pattern?: string
  placeholders?: string[]
  regex?: string
}
export function scanSource(src: string, file?: string): ScannedItem[]
export function looksLikeText(s: string): boolean
export function extract(
  root: string,
  label?: string,
): { files: number; skippedIds: number; entries: CatalogEntry[] }
