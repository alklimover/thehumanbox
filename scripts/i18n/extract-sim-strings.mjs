#!/usr/bin/env node
// Extracts the player-visible text of the simulation from crates/sim-core/src:
// every string literal and format! template, with the channel it ends up in
// (thought, event:<kind>, life:<category>, headline, memory, …), its call
// sites and, for templates, a RegExp that matches the finished text. The
// display-time translation layer (v0.4) and the coverage report build on it.
// See docs/fork/SIMTEXT.ru.md.
//
//   node scripts/i18n/extract-sim-strings.mjs [--out FILE] [--summary] [--root DIR]
//
// Nothing here parses Rust properly: a tokenizer (rust-tokens.mjs) plus a
// stack of open brackets is enough to tell which call or struct field a
// literal sits in. Text that reaches a sink through a variable is still
// collected (as channel `other`) when it looks like prose, so matching
// observed text against the catalog stays honest.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFormatString, tokenize } from './rust-tokens.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

// ---------------------------------------------------------------- files

// Test files only: actions are named like `forge_test.rs` too (a forge test is
// something people do), so `*_test.rs` is not a test file.
const TEST_PATH = /(^|\/)(tests?|benches)(\/|$)|(^|\/)tests?\.rs$|_tests\.rs$/

export function listRustFiles(root) {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (name.endsWith('.rs')) out.push(path)
    }
  }
  walk(root)
  return out
}

/** Drop `#[cfg(test)]` items (test modules and test-only functions) from a token list. */
export function withoutTestItems(toks) {
  const out = []
  for (let i = 0; i < toks.length; i++) {
    if (isCfgTest(toks, i)) {
      // Skip the attribute, then the item up to its closing brace or semicolon.
      let k = i + 7
      while (k < toks.length && toks[k].v === '#') k = skipAttribute(toks, k)
      let depth = 0
      for (; k < toks.length; k++) {
        const v = toks[k].t === 'punct' ? toks[k].v : null
        if (v === '{') depth++
        else if (v === '}' && --depth === 0) break
        else if (v === ';' && depth === 0) break
      }
      i = k
      continue
    }
    out.push(toks[i])
  }
  return out
}

function isCfgTest(toks, i) {
  const want = ['#', '[', 'cfg', '(', 'test', ')', ']']
  return want.every((v, k) => toks[i + k]?.v === v && toks[i + k].t !== 'str')
}

function skipAttribute(toks, i) {
  let depth = 0
  for (let k = i + 1; k < toks.length; k++) {
    if (toks[k].v === '[') depth++
    else if (toks[k].v === ']' && --depth === 0) return k + 1
  }
  return toks.length
}

// ---------------------------------------------------------------- sinks

/** Macros whose first string is a format string; `write!(f, "..")` has it second. */
const FORMAT_MACROS = new Set([
  'format!',
  'format_args!',
  'write!',
  'writeln!',
  'print!',
  'println!',
  'eprintln!',
  'panic!',
])
// Developer-only text: logging, assertions, panics and `.expect("..")` messages.
const LOG_MACROS = new Set([
  'expect',
  'print!',
  'println!',
  'eprintln!',
  'eprint!',
  'panic!',
  'debug_assert!',
  'assert!',
  'assert_eq!',
  'unreachable!',
  'todo!',
  'unimplemented!',
  'log!',
  'trace!',
  'debug!',
  'info!',
  'warn!',
  'error!',
])
/** Calls a literal passes through unchanged on its way to a sink. */
const TRANSPARENT = new Set(['from', 'into', 'to_string', 'to_owned', 'Some', 'Ok', 'push_str', 'clone'])

/** Struct fields and function parameters that hold text for the player. */
const TEXT_FIELDS = new Set([
  'thought',
  'text',
  'detail',
  'title',
  'headline',
  'description',
  'desc',
  'name',
  'label',
  'msg',
  'message',
  'line',
  'flavor',
  'summary',
  'story',
  'reason',
])

/**
 * The channel of a string by the call or struct it sits in. `frame` is the
 * innermost open bracket that is not a format macro or a transparent call;
 * `arg` is the argument (or field) position of the string inside it.
 */
function channelOf(frame) {
  if (!frame) return null
  const { callee, receiver, arg, field, firstLiteral, qualifier } = frame
  switch (callee) {
    case 'think':
    case 'set_thought!':
    case 'set_thought':
      return 'thought'
    case 'event':
      if (arg === 1) return `event:${firstLiteral ?? '?'}`
      return null
    case 'discover':
      return arg === 1 ? 'event:build' : null
    case 'push_event':
      if (arg === 4) return `event:${frame.literals?.[2] ?? '?'}`
      if (arg === 3) return 'event-actor'
      return null
    case 'log_life':
    case 'log_life_rel':
      return arg === 2 ? `life:${frame.literals?.[1] ?? '?'}` : null
    case 'log_event':
      return 'life:event'
    case 'push_back':
    case 'push':
    case 'push_front':
      if (receiver && /headline/i.test(receiver)) return 'headline'
      if (receiver && /memor/i.test(receiver)) return 'memory'
      if (receiver && /anchor/i.test(receiver)) return 'anchor'
      if (receiver && /stor(y|ies)/i.test(receiver)) return 'story'
      if (receiver && /event/i.test(receiver)) return 'event:?'
      return null
    case 'new':
      if (qualifier === 'MemoryEntry' && arg === 1) return 'memory'
      return null
  }
  if (callee?.startsWith('struct:') && field && TEXT_FIELDS.has(field)) return `field:${field}`
  return null
}

// ---------------------------------------------------------------- scan

/**
 * Every string literal of one file with its context. Returns items
 * `{ kind: 'literal' | 'template', text, parts?, args?, channel, sink, line }`.
 */
export function scanSource(src, file = '<src>') {
  const toks = withoutTestItems(tokenize(src))
  const items = []
  const stack = []
  const open = (i) => {
    const tok = toks[i]
    const prev = toks[i - 1]
    const frame = {
      open: tok.v,
      callee: null,
      receiver: null,
      qualifier: null,
      arg: 0,
      field: null,
      literals: [],
      start: i,
      argStart: i + 1,
      args: [],
    }
    if (tok.v === '(' || tok.v === '[') {
      if (prev?.t === 'ident') {
        frame.callee = prev.v
        if (toks[i - 2]?.v === '.') frame.receiver = receiverOf(toks, i - 3)
        if (toks[i - 2]?.v === '::') frame.qualifier = toks[i - 3]?.v
      } else if (prev?.v === '!' && toks[i - 2]?.t === 'ident') {
        frame.callee = toks[i - 2].v + '!'
      } else if (prev?.v === '>') {
        // Turbofish: `collect::<Vec<_>>(`; the name is before the `::<`.
        frame.callee = turbofishName(toks, i - 1)
      }
    } else if (tok.v === '{') {
      if (
        prev?.t === 'ident' &&
        /^[A-Z]/.test(prev.v) &&
        toks[i - 2]?.v !== 'impl' &&
        toks[i - 2]?.v !== 'struct' &&
        toks[i - 2]?.v !== 'enum' &&
        toks[i - 2]?.v !== 'trait' &&
        toks[i - 2]?.v !== 'for'
      ) {
        frame.callee = 'struct:' + prev.v
      }
    }
    stack.push(frame)
  }

  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i]
    if (tok.t === 'punct' && (tok.v === '(' || tok.v === '[' || tok.v === '{')) {
      open(i)
      continue
    }
    if (tok.t === 'punct' && (tok.v === ')' || tok.v === ']' || tok.v === '}')) {
      const frame = stack.pop()
      if (frame) frame.args.push([frame.argStart, i])
      if (frame?.pending) for (const item of frame.pending) finishTemplate(item, frame, toks)
      // An array of options with at least one phrase in it ("foraging",
      // "looking around") is a list of texts: its one-word items count too.
      if (frame?.items && frame.items.some((it) => / /.test(it.text) && /[a-z]{2,}/.test(it.text))) {
        for (const it of frame.items) it.textArray = true
      }
      continue
    }
    const top = stack[stack.length - 1]
    if (tok.t === 'punct' && tok.v === ',' && top) {
      top.args.push([top.argStart, i])
      top.argStart = i + 1
      top.arg++
      top.field = null
      continue
    }
    if (
      top?.callee?.startsWith('struct:') &&
      tok.t === 'ident' &&
      toks[i + 1]?.v === ':' &&
      toks[i - 1] &&
      (toks[i - 1].v === '{' || toks[i - 1].v === ',')
    ) {
      top.field = tok.v
      continue
    }
    if (tok.t !== 'str' || tok.byte) continue
    if (top && top.literals[top.arg] === undefined) top.literals[top.arg] = tok.v
    if (top && top.arg === 0 && top.firstLiteral === undefined) top.firstLiteral = tok.v

    // Which frame decides the channel: skip format macros and transparent calls.
    let k = stack.length - 1
    let template = false
    let logOnly = false
    while (k >= 0) {
      const f = stack[k]
      if (f.callee && FORMAT_MACROS.has(f.callee)) {
        const fmtArg = f.callee === 'write!' || f.callee === 'writeln!' ? 1 : 0
        if (f.arg === fmtArg && f.literals[fmtArg] === tok.v && !template && k === stack.length - 1)
          template = f
        if (LOG_MACROS.has(f.callee)) logOnly = true
        k--
        continue
      }
      if (f.callee && LOG_MACROS.has(f.callee)) {
        logOnly = true
        break
      }
      // Transparent calls, and tuples or groups: `push_back((tick, format!(..)))`.
      if ((f.callee && TRANSPARENT.has(f.callee)) || (!f.callee && f.open === '(')) {
        k--
        continue
      }
      break
    }
    if (logOnly) continue
    const sinkFrame = k >= 0 ? stack[k] : null
    // A bare literal followed by `.to_string()` etc. still belongs to the frame it sits in.
    const channel = channelOf(sinkFrame)
    const sink = describeSink(sinkFrame)
    const item = { text: tok.v, line: tok.line, channel, sink, file }
    if (template) {
      item.kind = 'template'
      item.frame = template
      template.pending = template.pending ?? []
      template.pending.push(item)
    } else {
      item.kind = 'literal'
      if (top?.open === '[' && !top.callee) (top.items = top.items ?? []).push(item)
    }
    items.push(item)
  }
  return items
}

function receiverOf(toks, i) {
  // `self.sim.headlines` -> `headlines`; `sim.headlines()` -> `headlines`.
  const t = toks[i]
  if (!t) return null
  if (t.t === 'ident') return t.v
  if (t.v === ')' || t.v === ']') {
    // Walk back to the matching opener and take the ident before it.
    let depth = 0
    for (let k = i; k >= 0; k--) {
      if (toks[k].v === ')' || toks[k].v === ']') depth++
      else if ((toks[k].v === '(' || toks[k].v === '[') && --depth === 0)
        return toks[k - 1]?.t === 'ident' ? toks[k - 1].v : null
    }
  }
  return null
}

function turbofishName(toks, i) {
  let depth = 0
  for (let k = i; k >= 0; k--) {
    if (toks[k].v === '>') depth++
    else if (toks[k].v === '<' && --depth === 0)
      return toks[k - 2]?.v === '::' ? (toks[k - 3]?.v ?? null) : null
    else if (toks[k].v === '>>') depth += 2
  }
  return null
}

function describeSink(frame) {
  if (!frame) return 'top'
  if (!frame.callee) return frame.open === '[' ? 'array' : frame.open === '{' ? 'block' : 'group'
  const who = frame.qualifier
    ? `${frame.qualifier}::${frame.callee}`
    : frame.receiver
      ? `${frame.receiver}.${frame.callee}`
      : frame.callee
  return frame.field ? `${who}.${frame.field}` : who
}

/** Format string -> placeholder names, a display pattern and an anchored RegExp source. */
function finishTemplate(item, frame, toks) {
  const fmtArg = frame.callee === 'write!' || frame.callee === 'writeln!' ? 1 : 0
  // Positional arguments after the format string, as source text.
  const argSrc = frame.args.slice(fmtArg + 1).map(([a, b]) =>
    toks
      .slice(a, b)
      .map((t) => t.src)
      .join(''),
  )
  let parts
  try {
    parts = parseFormatString(item.text)
  } catch {
    item.kind = 'literal'
    return
  }
  let next = 0
  const names = []
  let pattern = ''
  let regex = ''
  for (const part of parts) {
    if (typeof part === 'string') {
      pattern += part
      regex += escapeRegExp(part)
      continue
    }
    let name
    if (part.arg === '') name = argName(argSrc[next++], names.length)
    else if (/^\d+$/.test(part.arg)) name = argName(argSrc[Number(part.arg)], Number(part.arg))
    else name = part.arg
    names.push(name)
    pattern += `{${name}}`
    // A value may be empty ("{suffix}"), so `*?`, not `+?`.
    regex += /^[.\d]*[df]?$/.test(part.spec) && /\.\d|^\d/.test(part.spec) ? '(-?[\\d.]+)' : '(.*?)'
  }
  item.pattern = pattern
  item.placeholders = names
  item.regex = `^${regex}$`
  const letters = parts
    .filter((p) => typeof p === 'string')
    .join('')
    .replace(/[^A-Za-z]/g, '')
  // "{}", "{} {}", "{}: {}" only glue other text together.
  if (letters.length < 3) item.kind = 'compose'
}

function argName(src, index) {
  if (!src) return `arg${index}`
  const s = src.trim().replace(/^&+/, '')
  const m = /([A-Za-z_][A-Za-z0-9_]*)\s*(\(\))?\s*$/.exec(
    s.replace(/\.(clone|to_string|as_str|to_owned)\(\)$/, ''),
  )
  return m ? m[1] : `arg${index}`
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------- catalog

/** Player-facing text, as opposed to ids, keys, paths and format glue. */
export function looksLikeText(s) {
  if (!/[A-Za-z]/.test(s)) return false
  if (/^[a-z0-9_]+$/.test(s)) return false // snake_case id
  if (/^[A-Z0-9_]+$/.test(s)) return false // CONSTANT
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(s)) return false // kebab id
  if (/[/\\]|\.(rs|json|save|bin|ya?ml|toml)$|::|^[#%]|^\{|^https?:/.test(s)) return false
  if (/^[a-z]+[A-Z]\w*$/.test(s)) return false // camelCase
  return /[a-z]/.test(s) || /\s/.test(s)
}

/** `label` is how sites name the root (`crates/sim-core/src`), also when it is extracted elsewhere. */
export function extract(root, label = relative(REPO, root)) {
  const files = listRustFiles(root).filter((f) => !TEST_PATH.test(relative(root, f)))
  const entries = new Map()
  let skippedIds = 0
  for (const file of files) {
    const rel = join(label, relative(root, file))
    for (const item of scanSource(readFileSync(file, 'utf8'), rel)) {
      // "{}{}" glues nothing visible; "→ {} ({} ↔ {})" or "{}: {}" are kept as
      // compose entries: no words to translate, but they explain composed text.
      if (item.kind === 'compose' && item.pattern.replace(/\{[^}]*\}/g, '').trim() === '') continue
      const channel = item.channel ?? 'other'
      // In a known sink every literal counts (thoughts can be one word:
      // "wandering"); elsewhere only what looks like prose.
      const keep = item.channel
        ? /[A-Za-z]/.test(item.text) || item.kind === 'compose'
        : item.kind !== 'literal' ||
          item.textArray ||
          (looksLikeText(item.text) && /[a-z]{2,}/.test(item.text))
      // A lone lowercase word outside any sink ("still", "settled") may be an
      // id or a piece of composed text; keep it as a `word`, which matching
      // uses only as a part of a composed line.
      const kind = keep ? item.kind : item.kind === 'literal' && /^[a-z]{3,}$/.test(item.text) ? 'word' : null
      if (!kind) {
        skippedIds++
        continue
      }
      const key = `${channel}\u0000${kind}\u0000${item.text}`
      let entry = entries.get(key)
      if (!entry) {
        entry = { channel, kind, text: item.text, sites: [], sinks: new Set() }
        if (item.kind !== 'literal') {
          entry.pattern = item.pattern
          entry.placeholders = item.placeholders
          entry.regex = item.regex
        }
        entries.set(key, entry)
      }
      entry.sites.push(`${rel}:${item.line}`)
      entry.sinks.add(item.sink)
    }
  }
  const list = [...entries.values()]
    .map((e) => ({ ...e, sinks: [...e.sinks].sort(), sites: e.sites.sort() }))
    .sort(
      (a, b) =>
        a.channel.localeCompare(b.channel) ||
        a.kind.localeCompare(b.kind) ||
        (a.text < b.text ? -1 : a.text > b.text ? 1 : 0),
    )
  return { files: files.length, skippedIds, entries: list }
}

export function summarize(entries) {
  const byChannel = new Map()
  for (const e of entries) {
    const top = e.channel.replace(/:.*/, '')
    const row = byChannel.get(top) ?? { literal: 0, template: 0, compose: 0, word: 0, sites: 0, words: 0 }
    row[e.kind]++
    row.sites += e.sites.length
    if (e.kind === 'literal' || e.kind === 'template')
      row.words += (e.kind === 'template' ? e.pattern.replace(/\{[^}]*\}/g, ' ') : e.text)
        .split(/\s+/)
        .filter((w) => /[A-Za-z]/.test(w)).length
    byChannel.set(top, row)
  }
  return [...byChannel].sort((a, b) => b[1].literal + b[1].template - (a[1].literal + a[1].template))
}

// ---------------------------------------------------------------- cli

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const opt = (name, def) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : def
  }
  const root = resolve(opt('--root', join(REPO, 'crates/sim-core/src')))
  const out = resolve(opt('--out', join(REPO, 'scripts/i18n/out/sim-catalog.en.json')))
  const started = Date.now()
  const { files, skippedIds, entries } = extract(root)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify({ version: 1, root: relative(REPO, root), entries }, null, 1) + '\n')
  const rows = summarize(entries)
  console.log(
    `${files} files, ${entries.length} entries (${skippedIds} id-like literals skipped) in ${Date.now() - started} ms -> ${relative(process.cwd(), out)}`,
  )
  const cols = ['literal', 'template', 'compose', 'word', 'sites', 'words']
  console.log('channel'.padEnd(14), ...cols.map((c) => c.padStart(9)))
  for (const [ch, r] of rows) console.log(ch.padEnd(14), ...cols.map((c) => String(r[c]).padStart(9)))
}
