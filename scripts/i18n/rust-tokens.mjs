// A small Rust tokenizer for the simulation text extractor.
//
// It knows just enough of the Rust lexical grammar to find string literals
// reliably: line and nested block comments, escapes (including `\u{..}` and
// line continuations), raw strings `r#".."#`, byte and C strings, char
// literals versus lifetimes, raw identifiers and the multi-character
// punctuation the extractor matches on. It does not parse; see
// extract-sim-strings.mjs for that.

const PUNCT3 = ['<<=', '>>=', '...', '..=']
const PUNCT2 = [
  '::',
  '->',
  '=>',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '^=',
  '&=',
  '|=',
  '<<',
  '>>',
  '..',
]

const isIdentStart = (c) => /[\p{L}_]/u.test(c)
const isIdentChar = (c) => /[\p{L}\p{N}_]/u.test(c)
const isDigit = (c) => c >= '0' && c <= '9'

export class RustLexError extends Error {
  constructor(message, line, col) {
    super(`${message} at ${line}:${col}`)
    this.line = line
    this.col = col
  }
}

/**
 * Decode the body of a (non-raw) string or char literal: `\n`, `\t`, `\r`,
 * `\0`, `\\`, `\'`, `\"`, `\xNN`, `\u{...}` and the `\` + newline
 * continuation, which drops the newline and the leading whitespace after it.
 */
export function unescapeRust(body) {
  let out = ''
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c !== '\\') {
      out += c
      continue
    }
    const n = body[++i]
    switch (n) {
      case 'n':
        out += '\n'
        break
      case 't':
        out += '\t'
        break
      case 'r':
        out += '\r'
        break
      case '0':
        out += '\0'
        break
      case '\\':
        out += '\\'
        break
      case "'":
        out += "'"
        break
      case '"':
        out += '"'
        break
      case 'x':
        out += String.fromCharCode(parseInt(body.slice(i + 1, i + 3), 16))
        i += 2
        break
      case 'u': {
        const close = body.indexOf('}', i)
        out += String.fromCodePoint(parseInt(body.slice(i + 2, close).replace(/_/g, ''), 16))
        i = close
        break
      }
      case '\n':
      case '\r':
        while (i + 1 < body.length && /\s/.test(body[i + 1])) i++
        break
      default:
        out += n
    }
  }
  return out
}

/**
 * Tokenize Rust source. Returns tokens `{ t, v, src, line, col, start, end }`:
 * `t` is `str` (any string literal; `raw`/`byte` flags mark the flavour),
 * `char`, `lifetime`, `ident`, `num` or `punct`; `v` is the decoded value
 * for literals and the text otherwise. Comments and whitespace are dropped.
 */
export function tokenize(src) {
  const toks = []
  let i = 0
  let line = 1
  let lineStart = 0
  const n = src.length

  const advanceLines = (from, to) => {
    for (let k = from; k < to; k++) {
      if (src[k] === '\n') {
        line++
        lineStart = k + 1
      }
    }
  }
  const push = (t, v, start, end, extra) => {
    const tok = { t, v, src: src.slice(start, end), line, col: start - lineStart + 1, start, end }
    if (extra) Object.assign(tok, extra)
    toks.push(tok)
    advanceLines(start, end)
  }
  const fail = (msg, at) => {
    throw new RustLexError(msg, line, at - lineStart + 1)
  }

  // A quoted string body starting after the opening quote at `q`; returns the
  // index just past the closing quote.
  const scanQuoted = (q) => {
    let k = q + 1
    while (k < n) {
      const c = src[k]
      if (c === '\\') k += 2
      else if (c === '"') return k + 1
      else k++
    }
    fail('unterminated string', q)
  }
  // A raw string `r##"..."##` whose `r` is at `r`; returns [end, body].
  const scanRaw = (r) => {
    let k = r + 1
    let hashes = 0
    while (src[k] === '#') {
      hashes++
      k++
    }
    if (src[k] !== '"') return null
    const close = '"' + '#'.repeat(hashes)
    const endQuote = src.indexOf(close, k + 1)
    if (endQuote < 0) fail('unterminated raw string', r)
    return [endQuote + close.length, src.slice(k + 1, endQuote)]
  }

  while (i < n) {
    const c = src[i]
    // Whitespace.
    if (c === '\n') {
      line++
      lineStart = i + 1
      i++
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    // Comments.
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      let depth = 1
      let k = i + 2
      while (k < n && depth > 0) {
        if (src[k] === '/' && src[k + 1] === '*') {
          depth++
          k += 2
        } else if (src[k] === '*' && src[k + 1] === '/') {
          depth--
          k += 2
        } else k++
      }
      if (depth > 0) fail('unterminated block comment', i)
      advanceLines(i, k)
      i = k
      continue
    }
    // Raw strings, byte strings, C strings and raw identifiers.
    if (c === 'r' || c === 'b' || c === 'c') {
      let k = i
      const prefix =
        src[k] === 'b' && src[k + 1] === 'r' ? 'br' : src[k] === 'c' && src[k + 1] === 'r' ? 'cr' : c
      k += prefix.length
      if (prefix.endsWith('r') && (src[k] === '"' || (src[k] === '#' && /[#"]/.test(src[k + 1] ?? '')))) {
        const raw = scanRaw(k - 1)
        if (raw) {
          push('str', raw[1], i, raw[0], { raw: true, byte: prefix.startsWith('b') })
          i = raw[0]
          continue
        }
      }
      if (prefix === 'r' && src[k] === '#' && isIdentStart(src[k + 1] ?? '')) {
        let e = k + 1
        while (e < n && isIdentChar(src[e])) e++
        push('ident', src.slice(k + 1, e), i, e, { rawIdent: true })
        i = e
        continue
      }
      if ((prefix === 'b' || prefix === 'c') && src[k] === '"') {
        const e = scanQuoted(k)
        push('str', unescapeRust(src.slice(k + 1, e - 1)), i, e, { byte: prefix === 'b' })
        i = e
        continue
      }
      if (prefix === 'b' && src[k] === "'") {
        const e = src[k + 1] === '\\' ? src.indexOf("'", k + 3) + 1 : k + 3
        push('char', unescapeRust(src.slice(k + 1, e - 1)), i, e, { byte: true })
        i = e
        continue
      }
    }
    // Plain strings.
    if (c === '"') {
      const e = scanQuoted(i)
      push('str', unescapeRust(src.slice(i + 1, e - 1)), i, e)
      i = e
      continue
    }
    // Char literals and lifetimes / labels.
    if (c === "'") {
      if (src[i + 1] === '\\') {
        let e = i + 2
        if (src[e] === 'u') e = src.indexOf('}', e) + 1
        else if (src[e] === 'x') e += 3
        else e += 1
        if (src[e] !== "'") fail('bad char literal', i)
        push('char', unescapeRust(src.slice(i + 1, e)), i, e + 1)
        i = e + 1
        continue
      }
      const cp = src.codePointAt(i + 1)
      const w = cp > 0xffff ? 2 : 1
      if (src[i + 1 + w] === "'") {
        push('char', String.fromCodePoint(cp), i, i + 2 + w)
        i += 2 + w
        continue
      }
      let e = i + 1
      while (e < n && isIdentChar(src[e])) e++
      push('lifetime', src.slice(i, e), i, e)
      i = e
      continue
    }
    // Identifiers and keywords.
    if (isIdentStart(c)) {
      let e = i + 1
      while (e < n && isIdentChar(src[e])) e++
      push('ident', src.slice(i, e), i, e)
      i = e
      continue
    }
    // Numbers: `1_000`, `0xff`, `1.5e-3f32`, but `1..2` and `x.0.1` stay apart.
    if (isDigit(c)) {
      let e = i
      if (c === '0' && /[xob]/.test(src[i + 1] ?? '')) {
        e += 2
        while (e < n && /[0-9a-fA-F_]/.test(src[e])) e++
      } else {
        while (e < n && /[0-9_]/.test(src[e])) e++
        const prev = toks[toks.length - 1]
        const tupleIndex = prev && prev.t === 'punct' && prev.v === '.'
        if (!tupleIndex && src[e] === '.' && isDigit(src[e + 1] ?? '')) {
          e++
          while (e < n && /[0-9_]/.test(src[e])) e++
        } else if (!tupleIndex && src[e] === '.' && src[e + 1] !== '.' && !isIdentStart(src[e + 1] ?? '')) {
          e++ // `1.` is a float
        }
        if (/[eE]/.test(src[e] ?? '') && /[0-9+-]/.test(src[e + 1] ?? '')) {
          e += 2
          while (e < n && /[0-9_]/.test(src[e])) e++
        }
      }
      while (e < n && isIdentChar(src[e])) e++ // suffix
      push('num', src.slice(i, e), i, e)
      i = e
      continue
    }
    // Punctuation.
    const three = src.slice(i, i + 3)
    const two = src.slice(i, i + 2)
    const p = PUNCT3.includes(three) ? three : PUNCT2.includes(two) ? two : c
    push('punct', p, i, i + p.length)
    i += p.length
  }
  return toks
}

/**
 * Split a Rust format string into literal text and `{...}` placeholders.
 * `{{`/`}}` are literal braces. Each placeholder is `{ arg, spec }` where
 * `arg` is `''` (next positional), a number, or an identifier (named or an
 * inline capture), and `spec` is what follows the `:`.
 */
export function parseFormatString(fmt) {
  const parts = []
  let lit = ''
  for (let i = 0; i < fmt.length; i++) {
    const c = fmt[i]
    if (c === '{' && fmt[i + 1] === '{') {
      lit += '{'
      i++
    } else if (c === '}' && fmt[i + 1] === '}') {
      lit += '}'
      i++
    } else if (c === '{') {
      const close = fmt.indexOf('}', i)
      if (close < 0) throw new Error(`unterminated placeholder in ${JSON.stringify(fmt)}`)
      const body = fmt.slice(i + 1, close)
      const colon = body.indexOf(':')
      const arg = (colon < 0 ? body : body.slice(0, colon)).trim()
      const spec = colon < 0 ? '' : body.slice(colon + 1)
      if (lit) parts.push(lit)
      lit = ''
      parts.push({ arg, spec })
      i = close
    } else {
      lit += c
    }
  }
  if (lit) parts.push(lit)
  return parts
}
