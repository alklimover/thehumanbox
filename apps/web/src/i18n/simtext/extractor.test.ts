// Checks for the simulation text extractor (scripts/i18n, docs/fork/SIMTEXT.ru.md).
import { describe, expect, it } from 'vitest'
import { parseFormatString, tokenize } from '../../../../../scripts/i18n/rust-tokens.mjs'
import { scanSource } from '../../../../../scripts/i18n/extract-sim-strings.mjs'
import { makeMatcher } from '../../../../../scripts/i18n/sim-coverage.mjs'

const strings = (src: string) =>
  tokenize(src)
    .filter((t) => t.t === 'str')
    .map((t) => t.v)

describe('rust tokenizer', () => {
  it('decodes escapes, raw strings and line continuations', () => {
    expect(strings(String.raw`let a = "say \"hi\"\n"; let b = r#"a "quoted" word"#;`)).toEqual([
      'say "hi"\n',
      'a "quoted" word',
    ])
    expect(strings('let c = "one \\\n      two";')).toEqual(['one two'])
    expect(strings('let d = "\\u{1F494} gone";')).toEqual(['\u{1F494} gone'])
  })

  it('skips comments and tells chars from lifetimes', () => {
    expect(strings(`// "no"\n/* "no" /* "nested" */ */ fn f<'a>(x: &'a str) -> char { 'x'; "yes" }`)).toEqual(
      ['yes'],
    )
  })

  it('splits format strings into text and placeholders', () => {
    expect(parseFormatString('{} met {name:>4} at {{home}} {0:.1}')).toEqual([
      { arg: '', spec: '' },
      ' met ',
      { arg: 'name', spec: '>4' },
      ' at {home} ',
      { arg: '0', spec: '.1' },
    ])
  })
})

describe('extractor', () => {
  const scan = (src: string) =>
    scanSource(src, 'x.rs').map(({ kind, text, channel, pattern }) => ({ kind, text, channel, pattern }))

  it('knows the channel of a literal by its sink', () => {
    expect(
      scan(`fn f(ctx: &mut ActionCtx) {
        ctx.think("chopping wood");
        ctx.event("life", "chopped wood");
        org.log_life(tick, "birth", format!("welcomed {}", child));
        sim.headlines.push_back((tick, format!("{name} founded a village")));
      }`),
    ).toEqual([
      { kind: 'literal', text: 'chopping wood', channel: 'thought', pattern: undefined },
      { kind: 'literal', text: 'life', channel: null, pattern: undefined },
      { kind: 'literal', text: 'chopped wood', channel: 'event:life', pattern: undefined },
      { kind: 'literal', text: 'birth', channel: null, pattern: undefined },
      { kind: 'template', text: 'welcomed {}', channel: 'life:birth', pattern: 'welcomed {child}' },
      {
        kind: 'template',
        text: '{name} founded a village',
        channel: 'headline',
        pattern: '{name} founded a village',
      },
    ])
  })

  it('leaves out test modules and log macros', () => {
    expect(
      scan(
        'fn a() { println!("debug {}", x); }\n#[cfg(test)]\nmod tests { fn b() { o.think("in a test"); } }',
      ),
    ).toEqual([])
  })

  it('marks every item of an array of phrases as text', () => {
    const items = scanSource('let opts = ["foraging", "looking around", "roaming"];', 'x.rs')
    expect(items.map((i) => [i.text, i.textArray])).toEqual([
      ['foraging', true],
      ['looking around', true],
      ['roaming', true],
    ])
  })
})

describe('matcher', () => {
  const entries = [
    {
      channel: 'event:life',
      kind: 'literal' as const,
      text: 'built a navigation cairn',
      sites: [],
      sinks: [],
    },
    { channel: 'memory', kind: 'literal' as const, text: 'The world is real.', sites: [], sinks: [] },
    {
      channel: 'life',
      kind: 'template' as const,
      text: 'heard that {} {}',
      pattern: 'heard that {actor_name} {detail}',
      regex: '^heard that (.+?) (.+?)$',
      sites: [],
      sinks: [],
    },
    {
      channel: 'other',
      kind: 'compose' as const,
      text: '{}: {}',
      pattern: '{a}: {b}',
      regex: '^(.+?): (.+?)$',
      sites: [],
      sinks: [],
    },
  ]
  const match = makeMatcher(entries)

  it('matches literals, templates and composed lines whose parts are known', () => {
    expect(match('built a navigation cairn')?.how).toBe('literal')
    expect(match('heard that Giho built a navigation cairn')?.how).toBe('template')
    expect(match('first_fire: the world is real')?.how).toBe('compose')
    expect(match('Giho: something unknown')).toBeNull()
  })
})
