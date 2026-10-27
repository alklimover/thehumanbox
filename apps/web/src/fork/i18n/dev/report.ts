// What the check has found, one row per distinct text.

/**
 * - `ui`: interface text that should be Russian;
 * - `sim-text`: free text from the simulation (thoughts, events, news, the life
 *   log), expected to be English until it is translated (v0.4) and hidden by default;
 * - `sim-label`: a simulation id that simLabel() has no Russian name for.
 */
export type FindingKind = 'ui' | 'sim-text' | 'sim-label'

export interface Finding {
  kind: FindingKind
  text: string
  /** The words that made it English. */
  words: string
  count: number
  /** Where it was: a short selector of the element, with the attribute when it was one. */
  where: string
  firstSeen: string
}

/** The report stops taking new rows past this many, so a long session cannot eat the memory. */
const MAX_ROWS = 5000

export class Report {
  private readonly rows = new Map<string, Finding>()
  private dropped = 0
  private readonly started = Date.now()

  add(kind: FindingKind, text: string, words: readonly string[], where: string) {
    const key = `${kind}\u0000${text}`
    const row = this.rows.get(key)
    if (row) {
      row.count += 1
      return
    }
    if (this.rows.size >= MAX_ROWS) {
      this.dropped += 1
      return
    }
    this.rows.set(key, {
      kind,
      text,
      words: words.join(' '),
      count: 1,
      where,
      firstSeen: `+${Math.round((Date.now() - this.started) / 1000)}s`,
    })
  }

  /** Rows, most frequent first; free simulation text only when asked for. */
  list(options: { sim?: boolean } = {}): Finding[] {
    return [...this.rows.values()]
      .filter((row) => options.sim || row.kind !== 'sim-text')
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
  }

  /** How many rows of each kind, and how many were not kept. */
  summary(): Record<FindingKind | 'dropped', number> {
    const counts = { ui: 0, 'sim-text': 0, 'sim-label': 0, dropped: this.dropped }
    for (const row of this.rows.values()) counts[row.kind] += 1
    return counts
  }

  clear() {
    this.rows.clear()
    this.dropped = 0
  }
}
