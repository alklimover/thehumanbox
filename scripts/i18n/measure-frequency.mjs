#!/usr/bin/env node
// How often each simulation text reaches the player. Runs the game's own WASM
// simulation (apps/web/src/wasm/sim-core, built by scripts/build-wasm.sh) for
// several seeds in parallel and reads the same fields the client shows:
// thoughts over heads, the event feed, headlines, and, for a sample of people
// whose card the player might open, the life log, recent thoughts and memories.
// See docs/fork/SIMTEXT.ru.md.
//
//   node scripts/i18n/measure-frequency.mjs [--seeds 1,2,3] [--ticks 20000] [--every 200]
//        [--people 12] [--wasm DIR] [--out FILE]
//
// What counts as one occurrence:
//   - thought: a person's current thought at a sample (it floats over the
//     head on the map), so frequent thoughts weigh more;
//   - event, headline, anchor, title, religion: once per distinct entry;
//   - life, thought-history, memory: once per entry of a sampled person.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')

if (isMainThread) await main()
else await work(workerData)

async function main() {
  const argv = process.argv.slice(2)
  const opt = (name, def) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : def
  }
  const seeds = opt('--seeds', '1,2,3,4,5,6,7,8')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const ticks = Number(opt('--ticks', '20000'))
  const every = Number(opt('--every', '200'))
  const people = Number(opt('--people', '12'))
  const wasm = resolve(opt('--wasm', join(REPO, 'apps/web/src/wasm/sim-core')))
  const out = resolve(opt('--out', join(REPO, 'scripts/i18n/out/sim-frequency.json')))
  const parallel = Math.max(
    1,
    Math.min(seeds.length, Number(opt('--jobs', String(availableParallelism() - 1)))),
  )

  const started = Date.now()
  const total = new Map()
  const perSeed = []
  const queue = [...seeds]
  const run = (seed) =>
    new Promise((resolveRun, reject) => {
      const w = new Worker(fileURLToPath(import.meta.url), {
        workerData: { seed, ticks, every, people, wasm },
      })
      w.on('message', (m) => {
        if (m.progress) process.stderr.write(`seed ${seed}: tick ${m.progress}\n`)
        if (m.done) {
          perSeed.push({
            seed,
            ms: m.ms,
            alive: m.alive,
            occurrences: m.counts.reduce((s, [, n]) => s + n, 0),
          })
          for (const [key, n] of m.counts) total.set(key, (total.get(key) ?? 0) + n)
          resolveRun()
        }
      })
      w.on('error', reject)
    })
  const lanes = Array.from({ length: parallel }, async () => {
    while (queue.length) await run(queue.shift())
  })
  await Promise.all(lanes)

  const rows = [...total]
    .map(([key, count]) => {
      const [channel, text] = key.split('\u0000')
      return { channel, text, count }
    })
    .sort((a, b) => b.count - a.count || a.channel.localeCompare(b.channel) || (a.text < b.text ? -1 : 1))
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(
    out,
    JSON.stringify({
      version: 1,
      seeds,
      ticks,
      every,
      people,
      runs: perSeed.sort((a, b) => a.seed - b.seed),
      rows,
    }) + '\n',
  )
  const occ = rows.reduce((s, r) => s + r.count, 0)
  console.log(
    `${seeds.length} seeds × ${ticks} ticks in ${Math.round((Date.now() - started) / 1000)} s: ${rows.length} distinct texts, ${occ} occurrences -> ${relative(process.cwd(), out)}`,
  )
}

async function work({ seed, ticks, every, people, wasm }) {
  const mod = await import(pathToFileURL(join(wasm, 'sim_core.js')).href)
  mod.initSync({ module: readFileSync(join(wasm, 'sim_core_bg.wasm')) })
  const started = Date.now()
  const sim = new mod.Sim(BigInt(seed))
  const counts = new Map()
  const seen = new Set()
  const add = (channel, text, once) => {
    if (typeof text !== 'string' || !/[A-Za-z]/.test(text)) return
    if (once !== undefined) {
      const k = `${channel}\u0000${once}\u0000${text}`
      if (seen.has(k)) return
      seen.add(k)
    }
    const key = `${channel}\u0000${text}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  // A cheap deterministic pick of people to "open", so runs are repeatable.
  let rng = (Number(seed) * 2654435761) >>> 0
  const rand = () => (rng = (Math.imul(rng ^ (rng >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 2 ** 32

  let alive = 0
  for (let t = every, frame = 0; t <= ticks; t += every, frame++) {
    sim.tickN(every)
    const f = JSON.parse(sim.fullFrame(frame, 0))
    const living = (f.organisms ?? []).filter((o) => o.alive)
    alive = living.length
    for (const o of living) {
      add('thought', o.thought)
      for (const a of o.anchor_events ?? []) add('anchor', Array.isArray(a) ? a[1] : a, `${o.id}`)
    }
    for (const e of f.events ?? []) {
      add('event', e.detail, `${e.tick}|${e.actor}`)
    }
    for (const h of f.headlines ?? []) add('headline', h.text, `${h.tick}`)
    for (const a of f.artworks ?? []) add('title', a.title, `art`)
    for (const b of f.books ?? []) add('title', b.title, `book`)
    for (const r of f.religions ?? []) add('religion', r.name, `rel`)
    for (let k = 0; k < people && living.length; k++) {
      const o = living[Math.floor(rand() * living.length)]
      let d
      try {
        d = JSON.parse(sim.orgDetail(o.id))
      } catch {
        continue
      }
      for (const e of d.life_log ?? []) add('life', e.text, `${o.id}|${e.tick}`)
      for (const e of d.thought_history ?? []) add('thought-history', e.text, `${o.id}|${e.tick}`)
      for (const e of d.memories ?? []) add('memory', e.text, `${o.id}|${e.tick_formed ?? e.tick}`)
    }
    if (frame % 25 === 0) parentPort.postMessage({ progress: t })
  }
  parentPort.postMessage({ done: true, ms: Date.now() - started, alive, counts: [...counts] })
}
