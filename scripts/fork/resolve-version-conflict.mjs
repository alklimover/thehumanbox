#!/usr/bin/env node
// Resolves a merge conflict in a package.json when the only thing the two
// sides disagree on is the "version" line: upstream's release bot bumps it on
// every release, and the fork takes upstream's version. Any other difference
// inside a conflict hunk is left for a human (exit 1, file untouched).
//
// The file must carry diff3 markers (`git checkout --conflict=diff3 -- FILE`)
// so each hunk has the common base next to ours and theirs.
//
// Usage: node scripts/fork/resolve-version-conflict.mjs FILE
import { readFileSync, writeFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: resolve-version-conflict.mjs FILE')
  process.exit(2)
}

const VERSION = /^\s*"version"\s*:/
const withoutVersion = (lines) => lines.filter((line) => !VERSION.test(line)).join('\n')

/** The hunk's resolution, or null when it is more than a version bump. */
function resolve(ours, base, theirs) {
  if (base === null) return null
  const [o, b, t] = [ours, base, theirs].map(withoutVersion)
  // Only the version differs, or only upstream touched the rest: take theirs.
  if (o === t || o === b) return theirs
  // Only the fork touched the rest: keep ours with upstream's version line.
  if (t === b) {
    const version = theirs.find((line) => VERSION.test(line))
    if (version === undefined) return null
    const at = ours.findIndex((line) => VERSION.test(line))
    if (at === -1) return null
    return ours.map((line, i) => (i === at ? version : line))
  }
  return null
}

const lines = readFileSync(file, 'utf8').split('\n')
const out = []
let unresolved = 0
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('<<<<<<< ')) {
    out.push(lines[i])
    continue
  }
  const ours = []
  const theirs = []
  let base = null
  let part = ours
  for (i++; i < lines.length && !lines[i].startsWith('>>>>>>> '); i++) {
    if (lines[i].startsWith('||||||| ')) part = base = []
    else if (lines[i] === '=======') part = theirs
    else part.push(lines[i])
  }
  const resolved = resolve(ours, base, theirs)
  if (resolved === null) unresolved++
  else out.push(...resolved)
}

if (unresolved > 0) {
  console.error(`${file}: ${unresolved} conflict hunk(s) change more than the version`)
  process.exit(1)
}
const text = out.join('\n')
JSON.parse(text)
writeFileSync(file, text)
