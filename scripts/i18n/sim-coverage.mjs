#!/usr/bin/env node
// Matches the texts the player saw (measure-frequency.mjs) against the
// extracted catalog (extract-sim-strings.mjs): how much of what is seen the
// catalog explains (extraction recall), how few strings cover most of the
// screen, and the most frequent texts nothing matches. With --tsv it also
// writes the catalog entries ranked by how often they were seen, the order
// to translate them in. See docs/fork/SIMTEXT.ru.md.
//
//   node scripts/i18n/sim-coverage.mjs [--catalog FILE] [--frequency FILE] [--tsv FILE] [--md FILE]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

/**
 * Names, numbers and ids: parts of a composed line that need no translation
 * here (snake_case ids such as milestone names go through the simLabel tables).
 */
const FREE =
  /^(|[\d\s.,:%+\-×/]+|[0-9a-f]{4,8}|[a-z]+\d+|[a-z0-9]+(?:_[a-z0-9]+)+|[A-Z][a-z]+(?:[ -][A-Z][a-z]+)*)$/

/**
 * A matcher over catalog entries. A text is explained by, in order: a literal;
 * a template (any placeholder value); a lone `word`; or a compose template
 * ("{label}: {text}") whose every part is itself explained or is a name,
 * number or id. Parts of composed lines may come lowercased and without the
 * final period ("I remember — the world is real…"), so they also match
 * literals case-insensitively. The result says how, which feeds the design
 * of the translation layer.
 */
export function makeMatcher(entries) {
  const exact = new Map()
  const folded = new Map()
  const words = new Map()
  const buckets = new Map()
  const loose = []
  const composes = []
  const fold = (t) =>
    t
      .toLowerCase()
      .replace(/[.!]+$/, '')
      .trim()
  for (const e of entries) {
    if (e.kind === 'literal') {
      if (!exact.has(e.text)) exact.set(e.text, [])
      exact.get(e.text).push(e)
      if (!folded.has(fold(e.text))) folded.set(fold(e.text), e)
    } else if (e.kind === 'word') {
      if (!words.has(e.text)) words.set(e.text, e)
    } else {
      const t = { entry: e, re: new RegExp(e.regex, 's'), weight: e.pattern.replace(/\{[^}]*\}/g, '').length }
      if (e.kind === 'compose') {
        composes.push(t)
        continue
      }
      const head = e.pattern.split('{')[0]
      if (head.length < 2) loose.push(t)
      else {
        const key = head.slice(0, 2)
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key).push(t)
      }
    }
  }
  composes.sort((a, b) => b.weight - a.weight)

  const match = (text, depth = 0) => {
    // A part of a composed line may have been capitalised ("🧬 The first …").
    if (depth > 0 && /^[A-Z][a-z]/.test(text)) {
      const lower = text[0].toLowerCase() + text.slice(1)
      const m = match(lower, depth === 1 ? 1 : depth) ?? null
      if (m && m.how !== 'word') return m
    }
    const hit = exact.get(text)
    if (hit) return { how: 'literal', entries: hit }
    let best = null
    for (const t of [...(buckets.get(text.slice(0, 2)) ?? []), ...loose]) {
      if ((!best || t.weight > best.weight) && t.re.test(text)) best = t
    }
    if (best) return { how: 'template', entries: [best.entry] }
    const w = words.get(text)
    if (w) return { how: 'word', entries: [w] }
    if (depth > 0) {
      const f = folded.get(fold(text))
      if (f) return { how: 'literal', entries: [f] }
    }
    if (depth >= 3) return null
    for (const t of composes) {
      const m = t.re.exec(text)
      if (!m) continue
      const parts = m.slice(1)
      if (parts.every((p) => FREE.test(p.trim()) || match(p.trim(), depth + 1)))
        return { how: 'compose', entries: [t.entry] }
    }
    return null
  }
  return (text) => match(text)
}

function pct(a, b) {
  return b ? `${((100 * a) / b).toFixed(1)}%` : '—'
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const opt = (name, def) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : def
  }
  const catalog = JSON.parse(
    readFileSync(resolve(opt('--catalog', join(REPO, 'scripts/i18n/out/sim-catalog.en.json'))), 'utf8'),
  )
  const freq = JSON.parse(
    readFileSync(resolve(opt('--frequency', join(REPO, 'scripts/i18n/out/sim-frequency.json'))), 'utf8'),
  )
  const match = makeMatcher(catalog.entries)

  const total = freq.rows.reduce((s, r) => s + r.count, 0)
  const perChannel = new Map()
  const unmatched = []
  const seenEntries = new Map()
  let matchedOcc = 0
  let matchedDistinct = 0
  for (const row of freq.rows) {
    const ch = perChannel.get(row.channel) ?? {
      distinct: 0,
      occ: 0,
      mDistinct: 0,
      mOcc: 0,
      literal: 0,
      template: 0,
      word: 0,
      compose: 0,
    }
    ch.distinct++
    ch.occ += row.count
    const m = match(row.text)
    if (m) {
      ch.mDistinct++
      ch.mOcc += row.count
      ch[m.how] += row.count
      matchedOcc += row.count
      matchedDistinct++
      const e = m.entries[0]
      const key = `${e.kind}\u0000${e.text}`
      const s = seenEntries.get(key) ?? { entry: e, count: 0, channels: new Set(), example: row.text }
      s.count += row.count
      s.channels.add(row.channel)
      seenEntries.set(key, s)
    } else {
      unmatched.push(row)
    }
    perChannel.set(row.channel, ch)
  }

  // How many catalog entries (by frequency) cover a share of what was seen.
  const ranked = [...seenEntries.values()].sort((a, b) => b.count - a.count)
  const curve = [50, 80, 90, 95, 99].map((p) => {
    let acc = 0
    let n = 0
    for (const r of ranked) {
      if ((100 * acc) / total >= p) break
      acc += r.count
      n++
    }
    return [p, (100 * acc) / total >= p ? n : null]
  })

  const lines = []
  lines.push(
    `Миров: ${freq.seeds.length} (seed ${freq.seeds.join(', ')}), по ${freq.ticks} тактов, срез каждые ${freq.every} тактов, карточки ${freq.people} случайных людей на срез.`,
  )
  lines.push('')
  lines.push(
    `Показов текста: ${total}, разных текстов: ${freq.rows.length}. Каталог: ${catalog.entries.length} записей.`,
  )
  lines.push('')
  lines.push(
    `**Полнота извлечения:** ${pct(matchedOcc, total)} показов (${pct(matchedDistinct, freq.rows.length)} разных текстов) объясняются каталогом.`,
  )
  lines.push('')
  lines.push('| Канал | Разных | Показов | Найдено (показы) | литералы | шаблоны | слова | склейки |')
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|')
  for (const [name, c] of [...perChannel].sort((a, b) => b[1].occ - a[1].occ)) {
    lines.push(
      `| ${name} | ${c.distinct} | ${c.occ} | ${pct(c.mOcc, c.occ)} | ${c.literal} | ${c.template} | ${c.word} | ${c.compose} |`,
    )
  }
  lines.push('')
  lines.push(`Записей каталога, встретившихся хотя бы раз: ${ranked.length} из ${catalog.entries.length}.`)
  lines.push('')
  lines.push('| Доля показов | Сколько записей каталога её дают |')
  lines.push('|---:|---:|')
  for (const [p, n] of curve) lines.push(`| ${p}% | ${n ?? 'не достигается (есть ненайденное)'} |`)
  lines.push('')
  lines.push('Самые частые тексты, которых нет в каталоге:')
  lines.push('')
  for (const r of unmatched.slice(0, 40))
    lines.push(`- ${r.count} × ${r.channel}: \`${r.text.replaceAll('`', 'ˋ').slice(0, 140)}\``)
  const md = lines.join('\n') + '\n'
  process.stdout.write(md)
  if (opt('--md')) writeFileSync(resolve(opt('--md')), md)

  const tsv = opt('--tsv')
  if (tsv) {
    mkdirSync(dirname(resolve(tsv)), { recursive: true })
    const out = ['rank\tcount\tshare\tkind\tchannels\ttext\texample\tsite']
    let acc = 0
    ranked.forEach((r, i) => {
      acc += r.count
      const e = r.entry
      const text = e.kind === 'template' ? e.pattern : e.text
      out.push(
        [
          i + 1,
          r.count,
          ((100 * acc) / total).toFixed(2),
          e.kind,
          [...r.channels].sort().join(','),
          text,
          e.kind === 'template' ? r.example : '',
          e.sites[0],
        ]
          .map((v) => String(v).replace(/[\t\n]/g, ' '))
          .join('\t'),
      )
    })
    writeFileSync(resolve(tsv), out.join('\n') + '\n')
  }
}
