// People's, tribes' and places' names in the player's alphabet. The simulation
// makes names from Latin syllables (generate_name, generate_tribe_name and
// surname_for_id in crates/sim-core/src/organism/organism/basics.rs:
// consonants "bdfghjklmnprstvwz", vowels "aeiou") and keeps them in Latin:
// they are compared and searched as sent. In Russian they are shown in
// Cyrillic, letter by letter, so «Lupif» reads «Лупиф».
import { getLocale } from './locale'

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

const LETTERS: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'к',
  d: 'д',
  f: 'ф',
  g: 'г',
  h: 'х',
  j: 'дж',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'кс',
  z: 'з',
}

function word(latin: string): string {
  const s = latin.toLowerCase()
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    const afterVowel = i > 0 && VOWELS.has(s[i - 1])
    if (c === 'd' && s[i + 1] === 'j') {
      // «dj» is one sound: «Лелавадж», not «Лелаваддж».
      continue
    } else if (c === 'e') {
      // «Эло», «Баэт», but «Лена».
      out += i === 0 || afterVowel ? 'э' : 'е'
    } else if (c === 'i' || c === 'y') {
      // «Кай», «Дайко», but «Мира», «Маио».
      const beforeVowel = i + 1 < s.length && VOWELS.has(s[i + 1])
      out += afterVowel && !beforeVowel ? 'й' : 'и'
    } else {
      out += LETTERS[c] ?? c
    }
  }
  if (latin[0] === latin[0].toUpperCase()) out = out[0].toUpperCase() + out.slice(1)
  return out
}

/** Every Latin word of a name in Cyrillic: "Lupif Gafo" → «Лупиф Гафо». */
export function nameRu(name: string): string {
  return name.replace(/[A-Za-z]+/g, word)
}

// The map draws every visible name each frame.
const shown = new Map<string, string>()

/** A name as shown: in Cyrillic in the Russian interface, as sent otherwise. */
export function displayName(name: string | null | undefined): string {
  if (!name) return ''
  if (getLocale() === 'en') return name
  let ru = shown.get(name)
  if (ru === undefined) {
    if (shown.size > 20000) shown.clear()
    ru = nameRu(name)
    shown.set(name, ru)
  }
  return ru
}

/**
 * The names inside a translated text: what is still Latin and capitalised in
 * Russian text is a name (ids and codes are lower case).
 */
export function namesInText(text: string): string {
  return text.replace(/\b[A-Z][a-z]+\b/g, word)
}

/** Whether a name matches a search query typed in either alphabet. */
export function nameMatches(name: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return name.toLowerCase().includes(q) || nameRu(name).toLowerCase().includes(q)
}
