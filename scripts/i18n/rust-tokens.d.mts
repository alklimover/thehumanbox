// Types for rust-tokens.mjs, for the vitest checks in apps/web/src/i18n/simtext.
export interface RustToken {
  t: 'str' | 'char' | 'lifetime' | 'ident' | 'num' | 'punct'
  v: string
  src: string
  line: number
  col: number
  start: number
  end: number
  raw?: boolean
  byte?: boolean
}
export type FormatPart = string | { arg: string; spec: string }
export function tokenize(src: string): RustToken[]
export function unescapeRust(body: string): string
export function parseFormatString(fmt: string): FormatPart[]
