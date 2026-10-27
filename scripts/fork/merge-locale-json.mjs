#!/usr/bin/env node
// Three-way merge of one Russian locale file by key, for an upstream sync
// (scripts/fork/upstream-sync.sh). Upstream owns the file's keys and layout;
// the fork rewrites some of the Russian texts in it (docs/fork/SYNC.ru.md). So:
//
//   - the keys and their order are upstream's (a key upstream removed goes, a
//     key it added comes, with upstream's text);
//   - a text only one side changed takes that side;
//   - a text both changed keeps the fork's, and is listed in the report: when
//     upstream also changed the English of that key, the fork's Russian may be
//     out of date (`--en-base` / `--en-theirs` tell which).
//
//   node scripts/fork/merge-locale-json.mjs --base B.json --ours O.json --theirs T.json --out F.json \
//     [--en-base EB.json --en-theirs ET.json] [--report R.tsv --label path]
//
// The report gets one line per kept fork text: "label<TAB>key<TAB>kind", kind
// "both" (both rewrote the text) or "en-changed" (and the English changed too).
// Exit code 0 when merged, 2 on bad input.
import { appendFileSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

/** A plural form object ({ one, few, many, other }) is one text, not a branch. */
const isLeaf = (node) => typeof node === 'string' || (node && typeof node === 'object' && typeof node.other === 'string')

/** Every text as `dotted.key -> value`, in file order. */
function flatten(node, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(node ?? {})) {
    const full = prefix ? `${prefix}.${key}` : key
    if (isLeaf(value)) out.set(full, value)
    else flatten(value, full, out)
  }
  return out
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * The merged tree (upstream's keys and order) and the fork texts kept over upstream's,
 * each as `[key, 'both' | 'en-changed']`.
 */
export function mergeLocale({ base, ours, theirs, enBase, enTheirs }) {
  const b0 = flatten(base)
  const o0 = flatten(ours)
  const eb = flatten(enBase)
  const et = flatten(enTheirs)
  const kept = []
  const rebuild = (node, prefix = '') => {
    const out = {}
    for (const [key, value] of Object.entries(node ?? {})) {
      const full = prefix ? `${prefix}.${key}` : key
      if (!isLeaf(value)) {
        out[key] = rebuild(value, full)
        continue
      }
      const o = o0.get(full)
      const b = b0.get(full)
      if (o === undefined || same(o, b) || same(o, value)) {
        out[key] = value
      } else if (same(value, b)) {
        out[key] = o
      } else {
        out[key] = o
        const enChanged = eb.size > 0 && et.size > 0 && !same(eb.get(full), et.get(full))
        kept.push([full, enChanged ? 'en-changed' : 'both'])
      }
    }
    return out
  }
  return { tree: rebuild(theirs), kept }
}

function main() {
  const { values: args } = parseArgs({
    options: {
      base: { type: 'string' },
      ours: { type: 'string' },
      theirs: { type: 'string' },
      out: { type: 'string' },
      'en-base': { type: 'string' },
      'en-theirs': { type: 'string' },
      report: { type: 'string' },
      label: { type: 'string', default: '' },
    },
  })
  if (!args.ours || !args.theirs || !args.out) {
    console.error(
      'usage: merge-locale-json.mjs --base B --ours O --theirs T --out F [--en-base EB --en-theirs ET] [--report R --label L]',
    )
    process.exit(2)
  }
  const read = (path) => (path && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8') || '{}') : {})
  const theirs = read(args.theirs)
  const { tree, kept } = mergeLocale({
    base: read(args.base),
    ours: read(args.ours),
    theirs,
    enBase: read(args['en-base']),
    enTheirs: read(args['en-theirs']),
  })
  writeFileSync(args.out, JSON.stringify(tree, null, 2) + '\n')
  if (args.report) for (const [key, kind] of kept) appendFileSync(args.report, `${args.label}\t${key}\t${kind}\n`)
  console.log(`${args.label || args.out}: ${flatten(theirs).size} keys, ${kept.length} fork texts kept over upstream's`)
}

// Real paths: a temp dir on macOS sits behind a symlink (/tmp -> /private/tmp).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
