#!/usr/bin/env node
// Markdown report for an upstream sync (scripts/fork/upstream-sync.sh): the PR
// body for a clean merge, or the issue body when the sync needs a human.
//
//   --mode pr         commits, changed areas, rules applied and the new strings
//                     that still need a Russian translation: upstream's new and
//                     changed interface keys (locales/en) whose Russian is
//                     missing or still English, simulation ids the fork's tables
//                     lack, and new simulation texts
//   --mode conflict   commits and the conflicted files
//   --mode workflows  commits and the workflow files GITHUB_TOKEN cannot push
//
// The text is Russian: it is read by the fork's owner on GitHub.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { parseArgs } from 'node:util'

const UPSTREAM = '1homsi/thehumanbox'
const FORK = 'alklimover/thehumanbox'
// v0.4 hook: once the simulation string extractor exists, the report runs it
// as `node <hook> --base <sha> --head <sha>` from the repo root and prints its
// stdout (Markdown) instead of the literal count below.
const SIM_EXTRACTOR_HOOK = 'scripts/i18n/sim-strings-diff.mjs'
const LIST_LIMIT = 150

const { values: args } = parseArgs({
  options: {
    mode: { type: 'string', default: 'pr' },
    repo: { type: 'string', default: '.' },
    base: { type: 'string' },
    upstream: { type: 'string' },
    head: { type: 'string' },
    branch: { type: 'string', default: 'sync/upstream' },
    date: { type: 'string', default: new Date().toISOString().slice(0, 10) },
    conflicts: { type: 'string' },
    resolutions: { type: 'string' },
    'locale-kept': { type: 'string' },
    'skip-guards': { type: 'string' },
    out: { type: 'string' },
    'title-out': { type: 'string' },
  },
})
if (!args.base || !args.upstream || (args.mode === 'pr' && !args.head)) {
  console.error('usage: sync-report.mjs --mode pr|conflict|workflows --base SHA --upstream SHA [--head SHA] ...')
  process.exit(2)
}
// Real path: vitest reports test files by it (macOS temp dirs sit behind /var -> /private/var).
const repo = realpathSync(args.repo)

function git(...argv) {
  const run = spawnSync('git', ['-C', repo, ...argv], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (run.status !== 0) throw new Error(`git ${argv.join(' ')}: ${run.stderr}`)
  return run.stdout
}

const short = (sha) => sha.slice(0, 8)
const code = (text) => '`' + text.replaceAll('`', 'ˋ') + '`'
const cell = (text) => text.replaceAll('|', '\\|')

function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`
  return `${n} ${many}`
}
const commitsWord = (n) => plural(n, 'коммит', 'коммита', 'коммитов')

function tsv(path) {
  if (!path || !existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'))
}

// ---------------------------------------------------------------- commits

function commits() {
  return git('log', '--no-merges', '--reverse', '--format=%h%x09%an%x09%s', `${args.base}..${args.upstream}`)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, author, subject] = line.split('\t')
      return { sha, author, subject }
    })
}

function commitSection(list) {
  const total = Number(git('rev-list', '--count', `${args.base}..${args.upstream}`).trim())
  const merges = total - list.length
  const lines = [`## Коммиты оригинала (${total})`, '']
  if (merges > 0) lines.push(`Без учёта слияний (${merges}).`, '')
  lines.push('| Коммит | Автор | Сообщение |', '|---|---|---|')
  for (const c of list) {
    lines.push(`| [${c.sha}](https://github.com/${UPSTREAM}/commit/${c.sha}) | ${cell(c.author)} | ${cell(c.subject)} |`)
  }
  return lines
}

// ---------------------------------------------------------------- areas

const AREAS = [
  ['crates/sim-core/', 'Симуляция (`crates/sim-core`)'],
  ['crates/', 'Прочие крейты (`crates/`)'],
  ['apps/server/', 'Сервер (`apps/server`)'],
  ['apps/web/src/i18n/', 'Переводы автора (`apps/web/src/i18n`)'],
  ['apps/web/src/fork/i18n/', 'Слой перевода форка (`apps/web/src/fork/i18n`)'],
  ['apps/web/', 'Интерфейс (`apps/web`)'],
  ['apps/desktop/', 'Десктоп (`apps/desktop`)'],
  ['.github/', 'CI (`.github`)'],
  ['scripts/', 'Скрипты (`scripts`)'],
  ['docs/', 'Документация (`docs`)'],
  ['', 'Прочее'],
]

function changedFiles(from, to) {
  return git('diff', '--no-renames', '--numstat', from, to)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [added, removed, path] = line.split('\t')
      return { path, added: Number(added) || 0, removed: Number(removed) || 0 }
    })
}

function areaSection(files) {
  const byArea = new Map()
  for (const file of files) {
    const [, label] = AREAS.find(([prefix]) => file.path.startsWith(prefix))
    const area = byArea.get(label) ?? { files: 0, added: 0, removed: 0 }
    area.files++
    area.added += file.added
    area.removed += file.removed
    byArea.set(label, area)
  }
  const lines = ['## Что затронуто', '', '| Область | Файлов | Строк + / − |', '|---|---:|---:|']
  for (const [, label] of AREAS) {
    const area = byArea.get(label)
    if (area) lines.push(`| ${label} | ${area.files} | +${area.added} / −${area.removed} |`)
  }
  const notes = []
  const paths = files.map((f) => f.path)
  if (paths.includes('scripts/determinism-fingerprint.json')) {
    notes.push('Изменился отпечаток детерминизма (`scripts/determinism-fingerprint.json`): у оригинала изменилась симуляция, старые сохранения могут вести себя иначе.')
  } else if (paths.some((p) => p.startsWith('crates/sim-core/'))) {
    notes.push('Изменён код симуляции: WASM нужно пересобрать (`scripts/build-wasm.sh`), CI проверит отпечаток детерминизма.')
  }
  const ci = paths.filter((p) => p.startsWith('.github/'))
  if (ci.length > 0) {
    notes.push(
      `⚠️ Оригинал меняет файлы CI: ${ci.map(code).join(', ')}. Проверьте, что в форк не попали авторские релизы, деплой или секреты.`,
    )
  }
  if (paths.includes('apps/web/pnpm-lock.yaml') || paths.includes('apps/desktop/pnpm-lock.yaml')) {
    notes.push('Обновились зависимости (`pnpm-lock.yaml`).')
  }
  if (notes.length > 0) lines.push('', ...notes.map((n) => `- ${n}`))
  return lines
}

// ---------------------------------------------------------------- rules

const RULE_TEXT = {
  'keep-deleted': 'изменён в оригинале, в форке удалён: оставлен удалённым',
  'upstream-version': 'конфликт только в `version`: взята версия оригинала',
  'locale-merge':
    'русский перевод слит по ключам (`scripts/fork/merge-locale-json.mjs`): ключи и тексты автора, поверх — правки форка',
}

function rulesSection() {
  const applied = tsv(args.resolutions)
  const lines = ['## Правила слияния', '']
  if (applied.length === 0) {
    lines.push('Конфликтов не было.')
  } else {
    for (const [rule, path] of applied) lines.push(`- ${code(path)}: ${RULE_TEXT[rule] ?? rule}`)
  }
  const kept = tsv(args['locale-kept'])
  if (kept.length > 0) {
    const stale = kept.filter(([, , kind]) => kind === 'en-changed')
    lines.push(
      '',
      `Тексты форка, оставленные поверх нового перевода автора: ${kept.length}.` +
        (stale.length > 0
          ? ` У ${stale.length} из них автор изменил и английский — перевод форка мог устареть, проверьте:`
          : ''),
    )
    for (const [file, key] of stale.slice(0, LIST_LIMIT)) lines.push(`- ${code(file)}: ${code(key)}`)
  }
  return lines
}

// ---------------------------------------------------------------- guards

/** The i18n tests that read the Rust sources and compare them with the Russian tables. */
function guardFiles() {
  const dir = join(repo, 'apps/web/src/fork/i18n')
  return readdirSync(dir, { recursive: true })
    .filter((file) => /\.test\.tsx?$/.test(file))
    .filter((file) => readFileSync(join(dir, file), 'utf8').includes('crates/sim-core'))
    .map((file) => join('src/fork/i18n', file))
    .sort()
}

/** The ids in a failed `expect(missing).toEqual([])`: "expected [ 'a', 'b' ] to deeply equal []". */
function missingIds(message) {
  const list = /expected \[ (.*) \] to (?:deeply )?equal \[\]/.exec(message)?.[1] ?? ''
  return [...list.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\(.)/g, '$1'))
}

// The project's vitest config with chai's 40-character truncation off, so a
// failure message lists every missing id instead of "[ 'a', …(3) ]".
const GUARD_CONFIG = '.sync-guards.vitest.config.mjs'
const GUARD_CONFIG_TEXT = `import base from './vitest.config.ts'
export default { ...base, test: { ...base.test, chaiConfig: { truncateThreshold: 0 } } }
`

function guardSection() {
  const lines = ['### Названия из симуляции (проверки vitest)', '']
  let files
  try {
    files = guardFiles()
  } catch (error) {
    return [...lines, `Не удалось найти проверки: ${error.message}`]
  }
  lines.push(`Проверки: ${files.map((f) => code(`apps/web/${f}`)).join(', ')}.`, '')
  if (args['skip-guards']) return [...lines, `Не запускались: ${args['skip-guards']}.`]

  const web = join(repo, 'apps/web')
  const scratch = mkdtempSync(join(tmpdir(), 'sync-guards-'))
  const output = join(scratch, 'vitest.json')
  writeFileSync(join(web, GUARD_CONFIG), GUARD_CONFIG_TEXT)
  const argv = ['exec', 'vitest', 'run', '--config', GUARD_CONFIG, '--reporter=json', `--outputFile=${output}`]
  const run = spawnSync('pnpm', [...argv, ...files], {
    cwd: web,
    encoding: 'utf8',
    env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    maxBuffer: 64 * 1024 * 1024,
  })
  let result
  try {
    result = JSON.parse(readFileSync(output, 'utf8'))
  } catch {
    const tail = `${run.stdout}\n${run.stderr}`.trim().split('\n').slice(-15).join('\n')
    return [...lines, 'vitest не отработал:', '', '```', tail, '```']
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(join(web, GUARD_CONFIG), { force: true })
  }

  const failed = result.testResults.flatMap((file) =>
    file.assertionResults
      .filter((test) => test.status === 'failed')
      .map((test) => ({ file: relative(web, file.name), test })),
  )
  const broken = result.testResults.filter((file) => file.status === 'failed' && file.assertionResults.length === 0)
  if (failed.length === 0 && broken.length === 0) {
    return [...lines, `✅ Все ${result.numPassedTests} проверок прошли: каждый id из симуляции имеет русское название.`]
  }
  lines.push(`❌ Упало проверок: ${failed.length + broken.length} из ${result.numTotalTests}.`, '')
  for (const { file, test } of failed) {
    const message = (test.failureMessages ?? []).join('\n')
    const ids = missingIds(message)
    const first = message.split('\n').find((l) => l.trim()) ?? ''
    lines.push(`- ${code(`apps/web/${file}`)} — «${test.fullName}»`)
    if (ids.length > 0) lines.push(`  - нет перевода: ${ids.map(code).join(', ')}`)
    else lines.push(`  - ${code(first.trim().slice(0, 300))}`)
  }
  for (const file of broken) {
    const first = (file.message ?? '').split('\n')[0]
    lines.push(`- ${code(`apps/web/${relative(web, file.name)}`)} не запустился: ${code(first.slice(0, 300))}`)
  }
  lines.push(
    '',
    'Тест останавливается на первой непрошедшей проверке, поэтому после добавления этих переводов могут всплыть следующие. Названия добавляются в таблицы форка `apps/web/src/fork/i18n/sim/*.ts`: интерфейс сначала берёт слово из `locales/ru` автора, а если там его нет — из таблицы форка.',
  )
  return lines
}

// ---------------------------------------------------------------- upstream's locale files

/** Upstream's locale files: the web app's (one folder per language, one file per area) and the desktop shell's. */
const LOCALE_SETS = [
  { en: 'apps/web/src/i18n/locales/en', ru: 'apps/web/src/i18n/locales/ru', label: 'интерфейс' },
  { en: 'apps/desktop/main/locales/en.json', ru: 'apps/desktop/main/locales/ru.json', label: 'десктоп' },
]

/** A plural form object ({ one, few, many, other }) is one text, not a branch. */
const isLeaf = (node) => typeof node === 'string' || (node && typeof node === 'object' && typeof node.other === 'string')

function flattenJson(node, prefix, out) {
  for (const [key, value] of Object.entries(node ?? {})) {
    const full = prefix ? `${prefix}.${key}` : key
    if (isLeaf(value)) out.set(full, value)
    else flattenJson(value, full, out)
  }
  return out
}

/** Every text of one locale at a commit, as `area.key -> text` (a folder) or `key -> text` (one file). */
function localeAt(sha, path) {
  const out = new Map()
  const show = (p) => {
    const run = spawnSync('git', ['-C', repo, 'show', `${sha}:${p}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    return run.status === 0 ? run.stdout : null
  }
  if (path.endsWith('.json')) {
    const text = show(path)
    if (text) flattenJson(JSON.parse(text), '', out)
    return out
  }
  const ls = spawnSync('git', ['-C', repo, 'ls-tree', '--name-only', `${sha}:${path}`], { encoding: 'utf8' })
  if (ls.status !== 0) return out
  for (const file of ls.stdout.split('\n').filter((f) => f.endsWith('.json'))) {
    const text = show(`${path}/${file}`)
    if (text) flattenJson(JSON.parse(text), file.slice(0, -'.json'.length), out)
  }
  return out
}

const shownText = (v) => (typeof v === 'string' ? v : Object.values(v).join(' / '))
const sameText = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sameAsEnglish = (ru, en) => {
  const english = typeof en === 'string' ? en : en.other
  return (typeof ru === 'string' ? [ru] : Object.values(ru)).some((form) => form.trim() === english.trim())
}

function localeSection() {
  const lines = ['### Ключи интерфейса автора (`locales/en`)', '']
  const problems = []
  const review = []
  let added = 0
  let changed = 0
  for (const set of LOCALE_SETS) {
    const before = localeAt(args.base, set.en)
    const after = localeAt(args.head, set.en)
    const ru = localeAt(args.head, set.ru)
    for (const [key, en] of after) {
      const old = before.get(key)
      if (old !== undefined && sameText(old, en)) continue
      if (old === undefined) added++
      else changed++
      const text = ru.get(key)
      const where = `${set.label}: ${key}`
      if (text === undefined) problems.push(`- ${code(where)} — нет русского текста (${code(shownText(en).slice(0, 120))})`)
      else if (sameAsEnglish(text, en))
        problems.push(`- ${code(where)} — русский совпадает с английским: ${code(shownText(text).slice(0, 120))}`)
      else review.push(`- ${code(where)}: ${code(shownText(en).slice(0, 100))} → ${code(shownText(text).slice(0, 140))}`)
    }
  }
  if (added + changed === 0) return [...lines, 'Новых и изменённых ключей нет.']
  lines.push(`Новых ключей: **${added}**, изменённых: **${changed}**.`, '')
  if (problems.length > 0) {
    lines.push(`❌ Без русского перевода: ${problems.length}.`, '', ...problems.slice(0, LIST_LIMIT))
    if (problems.length > LIST_LIMIT) lines.push(`- …и ещё ${problems.length - LIST_LIMIT}`)
  } else {
    lines.push('✅ У каждого нового и изменённого ключа есть русский текст.')
  }
  if (review.length > 0) {
    lines.push(
      '',
      '<details><summary>Русские тексты автора для сверки с глоссарием (<code>docs/fork/GLOSSARY.ru.md</code>)</summary>',
      '',
      ...review.slice(0, LIST_LIMIT * 2),
      ...(review.length > LIST_LIMIT * 2 ? [`- …и ещё ${review.length - LIST_LIMIT * 2}`] : []),
      '',
      '</details>',
    )
  }
  lines.push(
    '',
    'Правка перевода — прямо в `apps/web/src/i18n/locales/ru/*.json` (и `apps/desktop/main/locales/ru.json`): ключи там авторские, тексты форк может переписывать. При следующей синхронизации такие правки сохраняются поверх авторских (`scripts/fork/merge-locale-json.mjs`).',
  )
  return lines
}

// ---------------------------------------------------------------- UI strings

/** Added lines per file with their line numbers in `to`. */
function addedLines(from, to, pathspec) {
  const diff = git('diff', '--no-color', '--no-renames', '-U0', from, to, '--', ...pathspec)
  const files = new Map()
  let file = null
  let line = 0
  for (const text of diff.split('\n')) {
    if (text.startsWith('+++ ')) {
      file = text === '+++ /dev/null' ? null : text.slice(6)
      if (file) files.set(file, [])
    } else if (text.startsWith('@@')) {
      line = Number(/\+(\d+)/.exec(text)[1])
    } else if (file && text.startsWith('+')) {
      files.get(file).push({ line, text: text.slice(1) })
      line++
    }
  }
  return files
}

const UI_SKIP_FILE = /(\.test\.|\.spec\.|__tests__\/|\/test-utils?\/|\.d\.ts$|^apps\/web\/src\/(i18n|wasm|fork\/i18n)\/)/
const UI_SKIP_LINE = /^\s*(\/\/|\/\*|\*|import\b|export\s.*\bfrom\b)|console\.|classList|querySelector/
const JS_WORDS = /^(return|const|let|var|if|else|import|export|type|interface|case|default|await|yield|function|new|throw|async|for|while|switch|break|continue)\b/
// A literal right after one of these is a translation key or a class list.
const NOT_TEXT = /(\b(t|tn|ft|ftn|simLabel|simText|clsx|cn)\(|\bclass(Name)?=\{?)\s*$/

/** Looks like English prose: two or more words, at least one in lowercase, no Cyrillic. */
function englishText(raw) {
  const text = raw.replace(/\$\{[^}]*\}/g, ' ').trim()
  if (/[а-яё]/i.test(text) || !/\s/.test(text)) return false
  const words = text.match(/[A-Za-z][A-Za-z'’]*/g) ?? []
  if (words.length < 2 || !words.some((w) => /^[a-z]{2,}$/.test(w))) return false
  const tokens = text.split(/\s+/)
  // Class lists, selectors, CSS values and paths.
  if (tokens.every((t) => /^[\w:/[\]().#%!-]+$/.test(t)) && tokens.some((t) => /[-:/[\]#%]|\d/.test(t))) return false
  return true
}

function uiStrings(line) {
  if (UI_SKIP_LINE.test(line)) return []
  const found = []
  for (const m of line.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    if (NOT_TEXT.test(line.slice(0, m.index))) continue
    if (englishText(m[2])) found.push(m[2])
  }
  return found
}

function jsxText(line) {
  const found = []
  for (const m of line.matchAll(/>([^<>{}]+)</g)) {
    if (!/[=&|;()]/.test(m[1]) && englishText(m[1])) found.push(m[1].trim())
  }
  const bare = line.trim()
  // Bare JSX text, not an object field ("save: worldSave,"), a type member or an import list.
  const code = /^[\w$]+\??\s*:|[,;]$|\s(as|from)\s/.test(bare)
  if (/^[A-Za-z][A-Za-z0-9 ,.'’!?:;–—-]*$/.test(bare) && !code && !JS_WORDS.test(bare) && englishText(bare))
    found.push(bare)
  return found
}

function uiSection() {
  const lines = ['### Английский текст в интерфейсе (эвристика)', '']
  const hits = []
  for (const [file, added] of addedLines(args.base, args.head, ['apps/web/src'])) {
    if (!/\.tsx?$/.test(file) || UI_SKIP_FILE.test(file)) continue
    for (const { line, text } of added) {
      const strings = [...uiStrings(text), ...(file.endsWith('.tsx') ? jsxText(text) : [])]
      for (const s of new Set(strings)) hits.push({ file, line, text: s })
    }
  }
  if (hits.length === 0) {
    return [...lines, '✅ Новых английских строк вне `t()` / `ft()` / `simLabel()` не найдено.']
  }
  lines.push(
    `Найдено ${hits.length}: строковые литералы и текст JSX с английскими словами в добавленных строках, не обёрнутые в \`t()\` автора или \`ft()\` / \`simLabel()\` форка. Это эвристика: среди них могут быть служебные строки. Строку, которую автор не перевёл, форк переводит своим каталогом (\`apps/web/src/fork/i18n/catalog\`, \`ft()\`).`,
    '',
  )
  for (const hit of hits.slice(0, LIST_LIMIT)) {
    lines.push(`- ${code(`${hit.file}:${hit.line}`)} — ${code(hit.text.slice(0, 160))}`)
  }
  if (hits.length > LIST_LIMIT) lines.push(`- …и ещё ${hits.length - LIST_LIMIT}`)
  return lines
}

// ---------------------------------------------------------------- sim-core strings

const RUST_TEST_FILE = /(\/tests?\/|(^|\/|_)tests?\.rs$|\/benches\/)/

function simSection() {
  const lines = ['### Строки в `crates/sim-core`', '']
  if (existsSync(join(repo, SIM_EXTRACTOR_HOOK))) {
    const run = spawnSync('node', [SIM_EXTRACTOR_HOOK, '--base', args.base, '--head', args.head], {
      cwd: repo,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
    if (run.status === 0) return [...lines, run.stdout.trim()]
    lines.push(`Экстрактор ${code(SIM_EXTRACTOR_HOOK)} упал (код ${run.status}), ниже — грубый подсчёт.`, '')
  }
  const perFile = []
  for (const [file, added] of addedLines(args.base, args.head, ['crates/sim-core'])) {
    if (!file.endsWith('.rs') || RUST_TEST_FILE.test(file)) continue
    let count = 0
    for (const { text } of added) {
      if (/^\s*\/\//.test(text)) continue
      count += [...text.matchAll(/"((?:\\.|[^"\\])*)"/g)].filter((m) => /[A-Za-z]/.test(m[1])).length
    }
    if (count > 0) perFile.push({ file, count })
  }
  const total = perFile.reduce((sum, f) => sum + f.count, 0)
  if (total === 0) {
    lines.push('Новых строковых литералов с буквами нет.')
  } else {
    perFile.sort((a, b) => b.count - a.count)
    lines.push(
      `Добавлено строковых литералов с буквами: **${total}** в ${perFile.length} файлах (без тестовых файлов; блоки \`#[cfg(test)]\` внутри файлов попадают в подсчёт).`,
      '',
      ...perFile.slice(0, 20).map((f) => `- ${code(f.file)}: ${f.count}`),
    )
    if (perFile.length > 20) lines.push(`- …и ещё ${perFile.length - 20} файлов`)
  }
  lines.push(
    '',
    `Это заглушка: какие из них видит игрок и есть ли у них перевод, покажет экстрактор строк симуляции из v0.4 (${code(SIM_EXTRACTOR_HOOK)}). Когда он появится, отчёт вызовет его вместо подсчёта.`,
  )
  return lines
}

// ---------------------------------------------------------------- bodies

const NO_DISCARD =
  '> **Не нажимайте на GitHub «Sync fork» → «Discard commits»:** это удалит все изменения форка. Синхронизация идёт только через такие PR.'

function prBody() {
  const list = commits()
  const total = Number(git('rev-list', '--count', `${args.base}..${args.upstream}`).trim())
  return {
    title: `Синхронизация с оригиналом (${commitsWord(total)})`,
    lines: [
      `Забираем ${commitsWord(total)} из оригинала ([${UPSTREAM}](https://github.com/${UPSTREAM})): ветка ${code(args.branch)} — это \`main\` форка (${code(short(args.base))}) со слиянием \`upstream/main\` (${code(short(args.upstream))}). Создано еженедельной синхронизацией (\`scripts/fork/upstream-sync.sh\`).`,
      '',
      NO_DISCARD,
      '',
      ...commitSection(list),
      '',
      ...areaSection(changedFiles(args.base, args.head)),
      '',
      ...rulesSection(),
      '',
      '## Новые непереведённые строки',
      '',
      ...localeSection(),
      '',
      ...guardSection(),
      '',
      ...uiSection(),
      '',
      ...simSection(),
      '',
      '## Проверки',
      '',
      '<!-- ci-run -->',
      'Перед слиянием дождитесь зелёного fork-ci на этой ветке. Если выше есть ❌, переводы можно добавить прямо в эту ветку или следующим PR. Как разбирать конфликты и непереведённое: [docs/fork/SYNC.ru.md](https://github.com/alklimover/thehumanbox/blob/main/docs/fork/SYNC.ru.md).',
    ],
  }
}

const CONFLICT_KIND = {
  UU: 'изменён в форке и в оригинале',
  AA: 'добавлен и в форке, и в оригинале',
  UD: 'удалён в оригинале, изменён в форке',
  DU: 'удалён в форке, изменён в оригинале (вне `.github/`)',
  AU: 'добавлен в форке, конфликт с оригиналом',
  UA: 'добавлен в оригинале, конфликт с форком',
  DD: 'удалён с обеих сторон',
  workflow: 'изменён workflow-файл',
}

function stopBody() {
  const conflicts = tsv(args.conflicts)
  const list = commits()
  const total = Number(git('rev-list', '--count', `${args.base}..${args.upstream}`).trim())
  const workflows = args.mode === 'workflows'
  const intro = workflows
    ? `Слияние коммитов из оригинала (${total}) прошло без конфликтов, но оно меняет workflow-файлы. GitHub не даёт \`GITHUB_TOKEN\` пушить такие изменения, поэтому ветка ${code(args.branch)} не создана.`
    : `Слияние коммитов из оригинала (${total}) остановилось на конфликтах, которые нельзя решить по известным правилам. Ничего не запушено.`
  const steps = [
    '## Как синхронизировать вручную',
    '',
    'На своём Mac, в чистом клоне форка:',
    '',
    '```sh',
    'git fetch origin && git fetch upstream',
    `git switch -c ${args.branch} origin/main`,
    'git merge -X no-renames upstream/main',
    workflows ? '# конфликтов нет, проверьте изменения в .github/workflows' : '# разрешите конфликты, затем git add … && git commit',
    `git push -u origin ${args.branch}`,
    `gh pr create -R ${FORK} --base main --head ${args.branch}`,
    '```',
    '',
    'Подробнее: [docs/fork/SYNC.ru.md](https://github.com/alklimover/thehumanbox/blob/main/docs/fork/SYNC.ru.md).',
  ]
  return {
    title: workflows
      ? `Синхронизация с оригиналом: нужен ручной пуш (${args.date})`
      : `Синхронизация с оригиналом: конфликты (${args.date})`,
    lines: [
      intro,
      '',
      NO_DISCARD,
      '',
      workflows ? '## Workflow-файлы' : '## Файлы с конфликтами',
      '',
      ...conflicts.map(([kind, path]) => `- ${code(path)}: ${CONFLICT_KIND[kind] ?? kind}`),
      '',
      ...rulesSection(),
      '',
      ...steps,
      '',
      ...commitSection(list),
    ],
  }
}

const { title, lines } = args.mode === 'pr' ? prBody() : stopBody()
const body = lines.join('\n') + '\n'
if (args.out) writeFileSync(args.out, body)
else process.stdout.write(body)
if (args['title-out']) writeFileSync(args['title-out'], title + '\n')
