// How much of the simulation text a player sees is in Russian, weighted by how
// often each text appeared in the measured runs (docs/fork/simtext/
// frequency-ranked.tsv, made by scripts/i18n/measure-frequency.mjs). Fails
// below a floor rather than on every untranslated line, since upstream adds
// lines every day. In CI the table also goes to the job summary.
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extract } from '../../../../../scripts/i18n/extract-sim-strings.mjs'
import { hasSimText, type SimTextChannel } from '.'
import { artworkTitle, bookTitle, faithName } from './names'

/** The share (%) of seen simulation text below which the check fails. */
const FLOOR = 95

const REPO = join(__dirname, '../../../../..')
const rows = readFileSync(join(REPO, 'docs/fork/simtext/frequency-ranked.tsv'), 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [, count, , kind, channels, text, example] = line.split('\t')
    return { count: Number(count), kind, channels: channels.split(','), text, example }
  })

// Texts the simulation no longer writes (upstream removed or reworded them) do not count.
const current = new Set(
  extract(join(REPO, 'crates/sim-core/src'), 'crates/sim-core/src').entries.map((e) => e.text),
)

const CHANNEL: Record<string, SimTextChannel> = { 'thought-history': 'thought' }
const WORD: Record<string, string> = {
  thought: 'мысль над головой',
  'thought-history': 'недавние мысли',
  event: 'события',
  life: 'летопись',
  memory: 'воспоминания',
  headline: 'заголовки',
}

function known(channel: string, text: string): boolean {
  if (channel === 'religion') return faithName(text) !== null
  if (channel === 'title') return bookTitle(text) !== null || artworkTitle(text) !== null
  return hasSimText(CHANNEL[channel] ?? (channel as SimTextChannel), text)
}

describe('simulation text coverage', () => {
  it(`stays above ${FLOOR}% of what the player sees`, () => {
    const total = new Map<string, { all: number; ru: number }>()
    const missing: { count: number; channel: string; text: string }[] = []
    for (const row of rows) {
      if (!current.has(row.text)) continue
      // A template is checked on a real line it wrote; a compose entry is only its parts.
      const sample = row.kind === 'literal' ? row.text : row.example
      if (!sample) continue
      // The count is for the text in all its channels together: share it out.
      const count = row.count / row.channels.length
      for (const channel of row.channels) {
        const t = total.get(channel) ?? { all: 0, ru: 0 }
        t.all += count
        if (known(channel, sample)) t.ru += count
        else missing.push({ count, channel, text: sample })
        total.set(channel, t)
      }
    }
    const all = [...total.values()].reduce((a, t) => a + t.all, 0)
    const ru = [...total.values()].reduce((a, t) => a + t.ru, 0)
    const share = (100 * ru) / all
    const pct = (n: number) => `${n.toFixed(1).replace('.', ',')} %`

    const summary = process.env.GITHUB_STEP_SUMMARY
    if (summary) {
      const lines = [
        `### Тексты симуляции на русском: ${pct(share)} (порог ${FLOOR} %)`,
        '',
        '| Канал | Покрытие |',
        '|---|---:|',
        ...[...total]
          .filter(([, t]) => t.all > 1000)
          .sort((a, b) => b[1].all - a[1].all)
          .map(([c, t]) => `| ${WORD[c] ?? c} | ${pct((100 * t.ru) / t.all)} |`),
        '',
        '<details><summary>Самые частые непереведённые</summary>',
        '',
        ...missing
          .sort((a, b) => b.count - a.count)
          .slice(0, 30)
          .map((m) => `- ${Math.round(m.count)} · ${m.channel} · \`${m.text.replace(/`/g, "'")}\``),
        '',
        '</details>',
        '',
      ]
      appendFileSync(summary, lines.join('\n'))
    }
    expect(share, `simulation text in Russian: ${share.toFixed(2)}%`).toBeGreaterThanOrEqual(FLOOR)
  })
})
