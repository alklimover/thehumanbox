// Does a piece of on-screen text still carry English? Latin letters alone are
// not enough: people and tribes have Latin names, keys keep their English
// names, and units and ids sit next to numbers. What is left is English.
import { ALLOWED_PHRASES, ALLOWED_WORDS } from './allowlist'

/**
 * The shape of every name the simulation makes up for people and tribes:
 * consonant–vowel syllables from fixed letter sets, with at most two consonants
 * together and one at the end ("Lupif", "Kora", "Tamen"). See
 * crates/sim-core/src/organism/organism/basics.rs (generate_name, generate_tribe_name).
 */
const NAME_SHAPE = /^[bdfghjklmnprstvwz][aeiou](?:[bdfghjklmnprstvwz]{1,2}[aeiou])+[bdfghjklmnprstvwz]?$/

/**
 * English words that happen to have the shape of a name. Capitalised they are
 * still flagged; a person who is really called "Here" shows up in the report
 * with a person card as its hint and is easy to tell apart.
 */
export const NAME_SHAPED_ENGLISH: ReadonlySet<string> = new Set([
  'here',
  'were',
  'have',
  'some',
  'more',
  'none',
  'made',
  'make',
  'take',
  'like',
  'done',
  'gone',
  'save',
  'time',
  'home',
  'menu',
  'note',
  'life',
])

/** URLs, e-mail addresses and dotted names (thehumanbox.com, .world.save, v0.6.22) are not prose. */
const NOT_PROSE = /\b(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+|\S*[A-Za-z0-9]\.[A-Za-z]\S*/g

const LATIN_WORD = /[A-Za-z]+/g

export interface Allowlist {
  phrases: readonly string[]
  words: ReadonlySet<string>
}

export function makeAllowlist(phrases: readonly string[], words: readonly string[]): Allowlist {
  // Longest first, so "The Human Box" goes before "Human Box".
  const sorted = [...phrases].sort((a, b) => b.length - a.length)
  return { phrases: sorted, words: new Set(words.map((w) => w.toLowerCase())) }
}

export const DEFAULT_ALLOWLIST = makeAllowlist(ALLOWED_PHRASES, ALLOWED_WORDS)

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

function looksLikeName(lower: string): boolean {
  return NAME_SHAPE.test(lower) && !NAME_SHAPED_ENGLISH.has(lower)
}

function isEnglishWord(
  word: string,
  before: string | undefined,
  after: string | undefined,
  allow: Allowlist,
) {
  // Single letters are key names, variables and abbreviations ("x", "F", "t").
  if (word.length < 2) return false
  // Glued to a digit it is a unit or an id: "10x", "60fps", "F1", "t1234", "a3f9".
  if (isDigit(before) || isDigit(after)) return false
  const lower = word.toLowerCase()
  if (allow.words.has(lower)) return false
  if (word === lower) return true
  const rest = word.slice(1)
  // "Lupif", or a name written in capitals.
  if (rest === rest.toLowerCase() || word === word.toUpperCase()) return !looksLikeName(lower)
  // camelCase and other mixed case are technical names (macOS, WebGL, GitHub).
  return false
}

/** The English words in a piece of text, in order and without repeats; empty when the text is fine. */
export function englishWords(text: string, allow: Allowlist = DEFAULT_ALLOWLIST): string[] {
  if (!/[A-Za-z]/.test(text)) return []
  let prose = text.replace(NOT_PROSE, ' ')
  for (const phrase of allow.phrases) {
    if (!phrase) continue
    prose = prose.replace(new RegExp(escapeRegExp(phrase), 'gi'), ' ')
  }
  const found: string[] = []
  for (const match of prose.matchAll(LATIN_WORD)) {
    const word = match[0]
    const at = match.index ?? 0
    if (isEnglishWord(word, prose[at - 1], prose[at + word.length], allow) && !found.includes(word)) {
      found.push(word)
    }
  }
  return found
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
