// Display-time translation of the text the simulation writes: thoughts, events,
// the life log, memories, headlines. The simulation keeps writing English —
// its logic compares those strings — and only what is shown is translated.
// See docs/fork/SIMTEXT.ru.md.
//
// A table maps the English text, or a template from the extracted catalog
// (scripts/i18n/extract-sim-strings.mjs) such as "heard that {actor_name}
// {detail}", to Russian. Markup in the Russian text:
//   - `построил[а]`, `[пошёл|пошла]`: masculine | feminine forms, picked by the
//     person's sex; unknown sex shows both («построил(а)», «пошёл/пошла»);
//   - `{detail}`: the value is translated again as a text of the same channel
//     (nested phrases), and is kept as is when nothing matches (names, numbers);
//   - `{detail@actor_name}`: the nested text takes its sex from the person
//     named by the `actor_name` value;
//   - `{what|good}`: the value is a simulation id, shown with simLabel('good').

/** Where a text is shown. Thoughts read in the present tense, the rest in the past. */
export type SimTextChannel = 'thought' | 'event' | 'life' | 'memory' | 'headline' | 'anchor' | 'title'

export type Sex = 'male' | 'female'

/** A translation, or one per kind of channel when the same English serves both. */
export type SimTextEntry = string | { thought?: string; event?: string }

export type SimTextTable = Readonly<Record<string, SimTextEntry>>

export interface SimTextContext {
  /** The sex of the person the text is about (the thinker, the actor of an event). */
  sex?: Sex | null
  /** The sex of a person by name, for `{text@name}` placeholders. */
  sexOf?: (name: string) => Sex | null | undefined
}

/** Names a simulation id (simLabel) for `{value|domain}` placeholders. */
export type IdLabeler = (domain: string, id: string) => string | null

interface Template {
  key: string
  entry: SimTextEntry
  re: RegExp
  names: string[]
  /** Literal characters: the more, the more specific the template. */
  weight: number
}

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function compileTemplate(key: string, entry: SimTextEntry): Template {
  const names: string[] = []
  let source = ''
  let last = 0
  for (const m of key.matchAll(PLACEHOLDER)) {
    source += escapeRegExp(key.slice(last, m.index))
    source += '(.*?)'
    names.push(m[1])
    last = (m.index ?? 0) + m[0].length
  }
  source += escapeRegExp(key.slice(last))
  return {
    key,
    entry,
    re: new RegExp(`^${source}$`, 's'),
    names,
    weight: key.replace(PLACEHOLDER, '').length,
  }
}

function channelKind(channel: SimTextChannel): 'thought' | 'event' {
  return channel === 'thought' ? 'thought' : 'event'
}

function pick(entry: SimTextEntry, channel: SimTextChannel): string | undefined {
  if (typeof entry === 'string') return entry
  const kind = channelKind(channel)
  return entry[kind] ?? (kind === 'thought' ? entry.event : entry.thought)
}

/** Resolve `[m|f]` and `[f]` markup for a sex. */
export function genderize(text: string, sex: Sex | null | undefined): string {
  return text.replace(/\[([^\]|]*)(?:\|([^\]]*))?\]/g, (_, a: string, b: string | undefined) => {
    const [m, f] = b === undefined ? ['', a] : [a, b]
    if (sex === 'male') return m
    if (sex === 'female') return f
    return b === undefined ? `(${f})` : `${m}/${f}`
  })
}

const MAX_DEPTH = 4
const CACHE_LIMIT = 20_000

/** A translator over a set of tables. Results are cached per channel, sex and text. */
export function makeSimText(tables: readonly SimTextTable[], label: IdLabeler) {
  const exact = new Map<string, SimTextEntry>()
  // Literals by their folded form: inside composed lines the simulation may
  // lowercase a phrase and drop its period ("I remember — the world is real").
  const folded = new Map<string, SimTextEntry>()
  const fold = (t: string) =>
    t
      .toLowerCase()
      .replace(/[.!]+$/, '')
      .trim()
  const byHead = new Map<string, Template[]>()
  const loose: Template[] = []
  for (const table of tables) {
    for (const [key, entry] of Object.entries(table)) {
      if (!key.includes('{')) {
        exact.set(key, entry)
        if (!folded.has(fold(key))) folded.set(fold(key), entry)
        continue
      }
      const t = compileTemplate(key, entry)
      const head = key.split('{')[0]
      if (head.length < 2) loose.push(t)
      else {
        const list = byHead.get(head.slice(0, 2)) ?? []
        list.push(t)
        byHead.set(head.slice(0, 2), list)
      }
    }
  }
  for (const list of [...byHead.values(), loose]) list.sort((a, b) => b.weight - a.weight)

  const cache = new Map<string, string>()

  function fill(
    text: string,
    values: Map<string, string>,
    channel: SimTextChannel,
    ctx: SimTextContext,
    depth: number,
  ) {
    return text.replace(
      /\{([A-Za-z_][A-Za-z0-9_]*)(?:@([A-Za-z_][A-Za-z0-9_]*))?(?:\|([A-Za-z_]+))?\}/g,
      (whole, name: string, sexFrom?: string, domain?: string) => {
        const value = values.get(name)
        if (value === undefined) return whole
        if (domain) return label(domain, value) ?? value
        let inner = ctx
        if (sexFrom) inner = { ...ctx, sex: ctx.sexOf?.(values.get(sexFrom) ?? '') ?? null }
        return translate(value, channel, inner, depth + 1) ?? value
      },
    )
  }

  /** The Russian text, or null when no table knows it. */
  function translate(
    text: string,
    channel: SimTextChannel,
    ctx: SimTextContext,
    depth: number,
  ): string | null {
    if (depth > MAX_DEPTH || !/[A-Za-z]/.test(text)) return null
    const entry = exact.get(text)
    if (entry !== undefined) {
      const ru = pick(entry, channel)
      if (ru !== undefined) return genderize(ru, ctx.sex)
    }
    for (const t of [...(byHead.get(text.slice(0, 2)) ?? []), ...loose]) {
      const m = t.re.exec(text)
      if (!m) continue
      const ru = pick(t.entry, channel)
      if (ru === undefined) continue
      const values = new Map(t.names.map((n, i) => [n, m[i + 1]]))
      return genderize(fill(ru, values, channel, ctx, depth), ctx.sex)
    }
    // Inside a composed line a phrase may start with a capital ("🧬 The first …")
    // or lose its capital and period ("I remember — the world is real").
    if (depth > 0 && /^[A-Z][a-z]/.test(text)) {
      const ru = translate(text[0].toLowerCase() + text.slice(1), channel, ctx, depth)
      if (ru) return ru[0].toUpperCase() + ru.slice(1)
    }
    if (depth > 0) {
      const f = folded.get(fold(text))
      const ru = f === undefined ? undefined : pick(f, channel)
      if (ru !== undefined) {
        const out = genderize(ru, ctx.sex).replace(/[.!]+$/, '')
        return /^[a-z]/.test(text) && !/^I\b/.test(text) ? out[0].toLowerCase() + out.slice(1) : out
      }
    }
    return null
  }

  return {
    /** The text to show: Russian when known, else the English as the simulation wrote it. */
    text(channel: SimTextChannel, text: string | null | undefined, ctx: SimTextContext = {}): string {
      if (!text) return text ?? ''
      // Only the plain sex enters the key: sexOf is the same lookup for one frame.
      const key = `${channel}\u0000${ctx.sex ?? ''}\u0000${text}`
      const hit = cache.get(key)
      if (hit !== undefined) return hit
      const ru = translate(text, channel, ctx, 0) ?? text
      if (cache.size >= CACHE_LIMIT) cache.clear()
      if (!ctx.sexOf) cache.set(key, ru)
      return ru
    },
    /** A text inside a composed line: matched like a nested placeholder value. */
    part(channel: SimTextChannel, text: string, ctx: SimTextContext = {}): string | null {
      return translate(text, channel, ctx, 1)
    },
    /** Whether a table knows the text (for coverage checks and the dev check). */
    knows(channel: SimTextChannel, text: string): boolean {
      return translate(text, channel, {}, 0) !== null
    },
  }
}
