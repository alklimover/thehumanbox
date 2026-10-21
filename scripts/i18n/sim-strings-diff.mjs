#!/usr/bin/env node
// The simulation texts one commit adds over another, as Markdown for the
// upstream sync report (scripts/fork/sync-report.mjs calls it when present).
// Runs extract-sim-strings.mjs on both trees, taken with `git archive`, so the
// checkout is not touched. Also lists the keys of the Russian tables
// (apps/web/src/i18n/simtext/ru) that matched a text at --base and match
// nothing at --head: upstream reworded a translated line, and the table test
// fails until the key follows it.
//
//   node scripts/i18n/sim-strings-diff.mjs --base SHA --head SHA [--limit 60]
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { extract } from './extract-sim-strings.mjs'
import { makeMatcher } from './sim-coverage.mjs'

const { values: args } = parseArgs({
  options: { base: { type: 'string' }, head: { type: 'string' }, limit: { type: 'string', default: '60' } },
})
if (!args.base || !args.head) {
  console.error('usage: sim-strings-diff.mjs --base SHA --head SHA')
  process.exit(2)
}

const SRC = 'crates/sim-core/src'
const CHANNEL_WORD = {
  thought: 'мысли',
  event: 'события',
  life: 'летопись',
  memory: 'воспоминания',
  headline: 'заголовки',
  field: 'поля структур',
  'event-actor': 'действующие лица',
  other: 'прочее',
}

function catalogAt(sha) {
  const dir = mkdtempSync(join(tmpdir(), 'sim-strings-'))
  try {
    const tar = execFileSync('git', ['archive', '--format=tar', sha, SRC], { maxBuffer: 512 * 1024 * 1024 })
    execFileSync('tar', ['-x', '-C', dir], { input: tar })
    return extract(join(dir, SRC), SRC).entries
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const RU_TABLES = 'apps/web/src/i18n/simtext/ru'

/** The keys of the Russian tables at a commit, read from the source (prettier writes one per line). */
function russianKeys(sha) {
  let files
  try {
    files = execFileSync('git', ['ls-tree', '--name-only', `${sha}:${RU_TABLES}`], { encoding: 'utf8' }).split('\n')
  } catch {
    return []
  }
  const keys = []
  for (const file of files.filter((f) => f.endsWith('.ts'))) {
    const src = execFileSync('git', ['show', `${sha}:${RU_TABLES}/${file}`], { encoding: 'utf8' })
    for (const m of src.matchAll(/^ {2}('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|[A-Za-z_]\w*):/gm)) {
      const raw = m[1]
      keys.push({ file, key: /^['"]/.test(raw) ? raw.slice(1, -1).replace(/\\(.)/g, '$1') : raw })
    }
  }
  return keys
}

/** A line a key stands for: its placeholders filled with a name-like value (as tables.test.ts does). */
const sample = (k) => k.replace(/\{[A-Za-z_][A-Za-z0-9_]*\}/g, 'Zuvo')

const key = (e) => `${e.channel}\u0000${e.kind}\u0000${e.text}`
let baseList
try {
  baseList = catalogAt(args.base)
} catch {
  // Before upstream moved the simulation to crates/ (October 2026) there is nothing to compare.
  console.error(`${SRC} is missing at ${args.base}`)
  process.exit(1)
}
const afterAll = catalogAt(args.head)
const shown = (e) => e.kind === 'literal' || e.kind === 'template'
const before = new Set(baseList.filter(shown).map(key))
const afterList = afterAll.filter(shown)
const after = new Set(afterList.map(key))
const added = afterList.filter((e) => !before.has(key(e)))
const removed = [...before].filter((k) => !after.has(k)).length

const matchBase = makeMatcher(baseList)
const matchHead = makeMatcher(afterAll)
const reworded = russianKeys(args.head).filter(({ key: k }) => matchBase(sample(k)) && !matchHead(sample(k)))

const code = (t) => '`' + t.replaceAll('`', 'ˋ').replace(/\s+/g, ' ').slice(0, 140) + '`'
const lines = []
if (added.length === 0) {
  lines.push(`Новых текстов симуляции нет (убрано: ${removed}).`)
} else {
  const byChannel = new Map()
  for (const e of added) {
    const top = e.channel.replace(/:.*/, '')
    byChannel.set(top, (byChannel.get(top) ?? 0) + 1)
  }
  const parts = [...byChannel].sort((a, b) => b[1] - a[1]).map(([ch, n]) => `${CHANNEL_WORD[ch] ?? ch} ${n}`)
  lines.push(
    `Новых текстов симуляции: **${added.length}** (${parts.join(', ')}); убрано: ${removed}. Найдены экстрактором \`scripts/i18n/extract-sim-strings.mjs\`; переводятся на этапе 0.4 (\`docs/fork/SIMTEXT.ru.md\`).`,
    '',
  )
  const limit = Number(args.limit)
  const shown = [...added].sort(
    (a, b) => (a.channel === 'other') - (b.channel === 'other') || a.channel.localeCompare(b.channel),
  )
  for (const e of shown.slice(0, limit)) {
    lines.push(`- ${e.channel}: ${code(e.kind === 'template' ? e.pattern : e.text)} — ${code(e.sites[0])}`)
  }
  if (added.length > limit) lines.push(`- …и ещё ${added.length - limit}`)
}
if (reworded.length > 0) {
  const addedIn = (file) => added.filter((e) => e.sites.some((s) => s.startsWith(file)))
  lines.push(
    '',
    `**Переведённые фразы, которые автор изменил: ${reworded.length}.** Пока ключ в таблице не поправлен, \`tables.test.ts\` падает, а на экране английский. Рядом — новые тексты из того же файла Rust:`,
    '',
  )
  for (const { file, key: k } of reworded.slice(0, Number(args.limit))) {
    const site = matchBase(sample(k))?.entries?.[0]?.sites?.[0] ?? ''
    const near = site ? addedIn(site.replace(/:\d+$/, '')).slice(0, 3) : []
    const hint = near.length ? ` → ${near.map((e) => code(e.kind === 'template' ? e.pattern : e.text)).join(', ')}` : ''
    lines.push(`- \`ru/${file}\`: ${code(k)}${hint}`)
  }
}
process.stdout.write(lines.join('\n') + '\n')
