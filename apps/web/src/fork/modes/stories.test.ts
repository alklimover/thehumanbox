import { afterEach, describe, expect, it } from 'vitest'
import { setLocaleForTests } from '../../i18n/locale'
import { YEAR_TICKS } from '../../game/model/calendar'
import type { BattleInfo, OrganismState, WorldState } from '../../shared/types'
import {
  brinkStories,
  eraStories,
  faithStories,
  festivalStories,
  fillerStories,
  godStories,
  HOLD_MS,
  MAX_ROWS,
  nearestGoal,
  observerStories,
  outbreakStories,
  perilStories,
  pickStories,
  prayerStories,
  StoryWatch,
  thresholdStories,
  townStories,
  warStories,
  type Story,
} from './stories'

const NAMES = { a: 'Timovo', b: 'Sedua', c: 'Zerogu', d: 'Febovo' }

function person(id: string, lineage: string, x: number, y: number, extra: Partial<OrganismState> = {}) {
  return { id, name: id, lineage_id: lineage, x, y, age: 1000, alive: true, ...extra } as OrganismState
}

/** A small world of four tribes, each with a village; the fixtures add the rest. */
function world(extra: Partial<WorldState> = {}): WorldState {
  return {
    tick: 50_000,
    lineage_names: NAMES,
    lineage_sizes: Object.keys(NAMES).map((id) => ({ id, count: 10 })),
    organisms: [person('p1', 'a', 10, 10), person('p2', 'b', 30, 10), person('p3', 'c', 10, 30)],
    settlements: Object.keys(NAMES).map((id, i) => ({
      lineage_id: id,
      name: `${NAMES[id as keyof typeof NAMES]}burg`,
      tier: 3,
      tier_name: 'village',
      center: [i * 20, i * 10] as [number, number],
      population: 10,
      building_count: 5,
      capacity: 20,
      score: 1,
    })),
    events: [],
    ...extra,
  } as WorldState
}

function battle(id: string, extra: Partial<BattleInfo> = {}): BattleInfo {
  return {
    id,
    attackers: ['a'],
    defenders: ['b'],
    scale: 'skirmish',
    location: [20, 12],
    started_tick: 49_000,
    ended: false,
    casualties_a: 4,
    casualties_d: 2,
    initial_a: 10,
    initial_d: 8,
    ...extra,
  }
}

afterEach(() => setLocaleForTests('en'))

describe('the observer’s stories', () => {
  it('a war going on, with its dead, where it is fought', () => {
    const [war, ...rest] = warStories(world({ battles: [battle('w1'), battle('w0', { ended: true })] }))
    expect(rest).toEqual([])
    expect(war).toMatchObject({
      key: 'war:w1',
      kind: 'war',
      title: 'War: Timovo against Sedua',
      detail: 'The battle goes on, 6 have fallen',
      at: { x: 20, y: 12 },
      lineage: 'a',
      action: { kind: 'show' },
    })
    setLocaleForTests('ru')
    const ru = warStories(
      world({ battles: [battle('w1'), battle('w2', { casualties_a: 1, casualties_d: 0 })] }),
    )
    expect(ru.map((s) => [s.title, s.detail])).toEqual([
      ['Война: Тимово против Седуа', 'Идёт битва, погибли 6'],
      ['Война: Тимово против Седуа', 'Идёт битва, погиб 1'],
    ])
  })

  it('rivals not yet fighting are on the brink, the worst feud first', () => {
    const w = world({
      tribal_relations: [
        { a: 'a', b: 'b', attitude: -0.9, status: 'rivals' },
        { a: 'c', b: 'd', attitude: -0.4, status: 'rivals' },
        { a: 'a', b: 'c', attitude: -0.8, status: 'rivals' },
        { a: 'b', b: 'd', attitude: 0.5, status: 'ally' },
      ],
      battles: [battle('w1')],
    })
    const stories = brinkStories(w)
    // Timovo and Sedua already fight: that is a war, not a brink.
    expect(stories.map((s) => s.key)).toEqual(['brink:a:c', 'brink:c:d'])
    expect(stories[0].title).toBe('Timovo and Zerogu: on the brink of war')
    expect(stories[0].detail).toBe('The fiercest feud in the world')
    expect(stories[1].detail).toBe('The neighbours hate each other')
    // Between the two villages.
    expect(stories[0].at).toEqual({ x: 20, y: 10 })
    // A tribe that died out has no feud left.
    const gone = world({
      tribal_relations: [{ a: 'a', b: 'c', attitude: -0.8, status: 'rivals' }],
      lineage_sizes: [{ id: 'a', count: 3 }],
    })
    expect(brinkStories(gone)).toEqual([])
  })

  it('a tribe dying out, and for the god the power that helps', () => {
    const w = world({
      tribes_in_peril: [
        { lineage_id: 'c', tribe: 'Zerogu', population: 3, peak: 20, cause: 'hunger', since: 1 },
      ],
    })
    const [watch] = perilStories(w)
    expect(watch).toMatchObject({
      title: 'Zerogu is dying out: only 3 left',
      detail: 'They are starving',
      action: { kind: 'show' },
      at: { x: 40, y: 20 },
    })
    const [help] = perilStories(w, true)
    expect(help.detail).toBe('They are starving. “harvest” will help')
    expect(help.action).toEqual({ kind: 'tool', tool: 'harvest' })
  })

  it('a faith is new when it appears after the world was loaded, or its founding is still in the events', () => {
    const watch = new StoryWatch()
    const old = { id: 'r1', name: 'Sun Path', founder_lineage: 'd', adherents: 30 }
    watch.update(world({ religions: [old] }))
    expect(faithStories(world({ religions: [old] }), watch)).toEqual([])

    const fresh = { id: 'r2', name: 'Sun Path rel2', founder_lineage: 'd', adherents: 12 }
    const later = world({ tick: 50_200, religions: [old, fresh] })
    watch.update(later)
    const [story] = faithStories(later, watch)
    expect(story).toMatchObject({
      key: 'faith:r2',
      title: 'New faith: Sun Path rel2',
      detail: 'Founded by the Febovo tribe · 12 believers',
      lineage: 'd',
    })
    // Half a year on it is history.
    const after = world({ tick: 50_200 + YEAR_TICKS, religions: [old, fresh] })
    watch.update(after)
    expect(faithStories(after, watch)).toEqual([])

    // Just loaded, but the founding is in this frame's events.
    const loaded = new StoryWatch()
    const told = world({
      religions: [old],
      events: [
        { tick: 49_500, type: 'religion_founded' as never, actor: 'd', detail: 'founded Sun Path (sun)' },
      ],
    })
    loaded.update(told)
    expect(faithStories(told, loaded).map((s) => s.key)).toEqual(['faith:r1'])

    setLocaleForTests('ru')
    const ruLater = world({ tick: 50_300, religions: [old, fresh] })
    const ruFresh = new StoryWatch()
    ruFresh.update(world({ religions: [old] }))
    ruFresh.update(ruLater)
    expect(faithStories(ruLater, ruFresh).map((s) => [s.title, s.detail])).toEqual([
      ['Новая вера: Путь Солнца № 2', 'Основало племя Фебово · 12 верующих'],
    ])
    const one = world({ tick: 50_200, religions: [old, { ...fresh, adherents: 1 }] })
    const ruWatch = new StoryWatch()
    ruWatch.update(world({ religions: [old] }))
    ruWatch.update(one)
    expect(faithStories(one, ruWatch)[0].detail).toBe('Основало племя Фебово · 1 верующий')
  })

  it('a tribe with the people for its next era and at most one discovery to go', () => {
    const progress = (lineage_id: string, missing: string[], pop_ready = true) => ({
      lineage_id,
      era_name: 'stone',
      next_era: 'bronze',
      pop: 10,
      pop_required: 8,
      pop_ready,
      required: ['metallurgy', 'casting'],
      known: [],
      missing,
      discovery_ready: missing.length === 0,
      ready: missing.length === 0 && pop_ready,
    })
    const w = world({
      lineage_era_progress: [
        progress('a', ['smelting']),
        progress('b', []),
        progress('c', ['casting', 'kiln']),
        progress('d', ['casting'], false),
      ],
    })
    const stories = thresholdStories(w)
    expect(stories.map((s) => [s.title, s.detail])).toEqual([
      ['Timovo: on the threshold of a new era', 'Ahead: bronze. Still to discover: smelting'],
      ['Sedua: on the threshold of a new era', 'Ahead: bronze, any day now'],
    ])
    setLocaleForTests('ru')
    expect(thresholdStories(w)[0].detail).toBe('Впереди бронзовый век. Осталось открыть: плавка металла')
  })

  it('a new era, seen to change or told by the events, one per tribe', () => {
    const watch = new StoryWatch()
    const before = world({ lineage_eras: { a: 'stone', b: 'stone' } })
    watch.update(before)
    expect(eraStories(before, watch)).toEqual([])
    const now = world({
      tick: 50_100,
      lineage_eras: { a: 'bronze', b: 'stone' },
      events: [
        {
          tick: 49_000,
          type: 'era_advance' as never,
          actor: 'Sedua',
          detail: 'Sedua entered the stone era: tools',
        },
        {
          tick: 48_000,
          type: 'era_advance' as never,
          actor: 'Sedua',
          detail: 'Sedua entered the pre-stone era: x',
        },
      ],
    })
    watch.update(now)
    expect(eraStories(now, watch).map((s) => [s.key, s.detail])).toEqual([
      ['era:b:stone', 'The Sedua tribe'],
      ['era:a:bronze', 'The Timovo tribe · before: stone'],
    ])
    setLocaleForTests('ru')
    expect(eraStories(now, watch)[1].title).toBe('Новая эпоха: бронзовый век')
  })

  it('a settlement that grew into a town; the only town in the world is a quiet story', () => {
    const watch = new StoryWatch()
    const before = world()
    watch.update(before)
    expect(townStories(before, watch)).toEqual([])
    const grown = world({ tick: 50_100 })
    grown.settlements = grown.settlements!.map((s) =>
      s.lineage_id === 'b' ? { ...s, tier: 4, tier_name: 'town' } : s,
    )
    watch.update(grown)
    const [first] = townStories(grown, watch)
    expect(first).toMatchObject({
      title: 'The first town: Seduaburg',
      detail: 'The Sedua tribe · 10 inhabitants',
    })
    expect(first.weight).toBeGreaterThan(40)
    // Loaded with one town already there: told, but quietly.
    const loaded = new StoryWatch()
    loaded.update(grown)
    expect(townStories(grown, loaded)[0].weight).toBeLessThan(20)
    // Two towns, neither new: nothing to say.
    const two = world()
    two.settlements = two.settlements!.map((s) => ({ ...s, tier: 4 }))
    loaded.update(two)
    expect(townStories(two, loaded)).toEqual([])
  })

  it('an epidemic, and for the god the cure', () => {
    const w = world({ active_outbreaks: [{ kind: 'plague', infected: 5, lineage_id: 'a' }] })
    expect(outbreakStories(w)[0]).toMatchObject({
      title: 'Epidemic: plague',
      detail: '5 are sick · the Timovo tribe',
    })
    expect(outbreakStories(w, true)[0].action).toEqual({ kind: 'tool', tool: 'cure' })
    setLocaleForTests('ru')
    expect(outbreakStories(w)[0]).toMatchObject({ title: 'Эпидемия: мор', detail: 'Болеют 5 · племя Тимово' })
  })

  it('a festival is one row however many tribes hold it', () => {
    const fest = (name: string, lineage_id: string | undefined, x?: number) => ({
      name,
      lineage_id,
      x: x ?? 5,
      y: x === undefined ? 5 : 7,
    })
    const w = world({
      festivals: [
        fest('Spring Festival', 'a', 11),
        fest('Spring Festival', 'b'),
        fest('Harvest Feast', 'c'),
        { name: 'Midwinter Feast', lineage_id: 'd' },
      ],
    })
    const stories = festivalStories(w)
    // The midwinter feast has no place on the map: nothing to show.
    expect(stories.map((s) => [s.key, s.title, s.detail, s.tribes])).toEqual([
      ['festival:Spring Festival', 'Spring Festival', 'Celebrated by Timovo and Sedua', ['a', 'b']],
      ['festival:Harvest Feast', 'Harvest Feast', 'Celebrated by the Zerogu tribe', ['c']],
    ])
    expect(stories[0]).toMatchObject({ at: { x: 11, y: 7 }, lineage: 'a' })

    const three = world({
      festivals: [fest('Spring Festival', 'a'), fest('Spring Festival', 'b'), fest('Spring Festival', 'c')],
    })
    expect(festivalStories(three)[0]).toMatchObject({ detail: 'Celebrated by 3 tribes', tribes: [] })
    setLocaleForTests('ru')
    expect(festivalStories(w).map((s) => [s.title, s.detail])).toEqual([
      ['Весенний праздник', 'Празднуют Тимово и Седуа'],
      ['Праздник урожая', 'Празднует племя Зерогу'],
    ])
    expect(festivalStories(three)[0].detail).toBe('Празднуют 3 племени')
  })

  it('the oldest person and the largest family', () => {
    const w = world({
      organisms: [
        person('p1', 'a', 1, 1, { age: 30 * YEAR_TICKS, sex: 'female', name: 'Mira', surname: 'Lupif' }),
        person('p2', 'a', 2, 2, { surname: 'Lupif' }),
        person('p3', 'b', 3, 3, { age: 70 * YEAR_TICKS, alive: false }),
      ],
    })
    const [elder, family] = fillerStories(w)
    expect(elder).toMatchObject({
      title: 'The oldest woman alive: Mira, 30 yrs',
      person: 'p1',
      at: { x: 1, y: 1 },
    })
    expect(family).toMatchObject({
      title: 'The largest family: Lupif',
      detail: '2 people · the Timovo tribe',
    })
    setLocaleForTests('ru')
    expect(fillerStories(w)[0].title).toBe('Старейшая в мире — Мира, 30 лет')
  })

  it('reads a whole world without a story as an empty list', () => {
    const empty = { tick: 5, organisms: [], events: [] } as unknown as WorldState
    expect(observerStories(empty, new StoryWatch())).toEqual([])
    expect(godStories(empty)).toEqual([])
  })
})

describe('the god’s stories', () => {
  it('prayers, the one about to lapse marked; rain asked by many is one row', () => {
    const prayer = (id: number, kind: string, lineage_id: string, expires: number) => ({
      id,
      kind,
      lineage_id,
      tribe: NAMES[lineage_id as keyof typeof NAMES],
      x: 5,
      y: 6,
      created: 49_000,
      expires,
    })
    const w = world({
      prayers: [
        prayer(1, 'hunger', 'a', 50_100),
        prayer(2, 'rain', 'b', 52_000),
        prayer(3, 'rain', 'c', 52_000),
      ],
    })
    const stories = prayerStories(w)
    expect(stories.map((s) => [s.title, s.detail])).toEqual([
      ['Timovo pray for food', '“harvest” will help. The prayer will fade soon'],
      ['2 tribes pray for rain', '“rain” will help. An answer strengthens their faith'],
    ])
    expect(stories[0].action).toEqual({ kind: 'prayer', prayer: w.prayers![0] })
    expect(stories[0].weight).toBeGreaterThan(stories[1].weight)
    // The powers' labels are read when the module loads, so only the phrase around one changes here.
    setLocaleForTests('ru')
    expect(prayerStories(w)[0].detail).toBe('Поможет «harvest». Молитва скоро угаснет')
  })

  it('a tribe praying for several things is one row, its most urgent prayer', () => {
    const prayer = (id: number, kind: string, lineage_id: string, expires: number) => ({
      id,
      kind,
      lineage_id,
      tribe: NAMES[lineage_id as keyof typeof NAMES],
      x: id,
      y: 6,
      created: 49_000,
      expires,
    })
    const w = world({
      prayers: [
        prayer(1, 'shelter', 'a', 52_000),
        prayer(2, 'hunger', 'a', 50_100),
        prayer(3, 'thirst', 'a', 51_000),
        prayer(4, 'children', 'b', 52_000),
      ],
    })
    const stories = prayerStories(w)
    expect(stories.map((s) => [s.key, s.title, s.detail])).toEqual([
      [
        'prayer:tribe:a',
        'Timovo pray for food',
        '“harvest” will help. 2 more prayers. The prayer will fade soon',
      ],
      ['prayer:tribe:b', 'Sedua pray for children', '“love” will help. An answer strengthens their faith'],
    ])
    // The button answers the most urgent one, where it is.
    expect(stories[0].action).toEqual({ kind: 'prayer', prayer: w.prayers![1] })
    expect(stories[0].at).toEqual({ x: 2, y: 6 })
    expect(stories[0].tribes).toEqual(['a'])
    // Once it is answered the row is the same row, about the next one.
    const answered = world({ prayers: [w.prayers![0], w.prayers![2], w.prayers![3]] })
    expect(prayerStories(answered)[0]).toMatchObject({
      key: 'prayer:tribe:a',
      title: 'Timovo pray for clean water',
      detail: '“spring” will help. 1 more prayer',
    })
    setLocaleForTests('ru')
    expect(prayerStories(w)[0].detail).toBe('Поможет «harvest». Ещё 2 молитвы. Молитва скоро угаснет')
    expect(prayerStories(answered)[0].detail).toBe('Поможет «spring». Ещё 1 молитва')
  })

  it('puts the dying tribe above a war, and a war above an era to come', () => {
    const w = world({
      battles: [battle('w1')],
      tribes_in_peril: [
        { lineage_id: 'c', tribe: 'Zerogu', population: 3, peak: 20, cause: 'sickness', since: 1 },
      ],
    })
    const kinds = [...godStories(w)].sort((a, b) => b.weight - a.weight).map((s) => s.kind)
    expect(kinds).toEqual(['peril', 'war'])
    expect(godStories(w).find((s) => s.kind === 'war')?.detail).toBe(
      '“peace” stops the battle, “smite” punishes',
    )
  })

  it('the goal closest to done', () => {
    const goal = (id: string, progress: number, target: number, done = false) => ({
      id,
      title: id,
      progress,
      target,
      done,
    })
    expect(nearestGoal([goal('a', 1, 10), goal('b', 4, 5), goal('c', 5, 5, true)])?.id).toBe('b')
    expect(nearestGoal([goal('c', 5, 5, true)])).toBeNull()
    expect(nearestGoal(undefined)).toBeNull()
  })
})

describe('the rows shown', () => {
  const story = (key: string, weight: number, kind: Story['kind'] = 'war', tribes?: string[]): Story => ({
    key,
    kind,
    icon: '',
    title: key,
    detail: '',
    weight,
    at: null,
    tribes,
    action: { kind: 'show' },
  })
  const keys = (rows: { story: Story }[]) => rows.map((r) => r.story.key)

  it('at most five, two of a kind, the heaviest', () => {
    const rows = pickStories(
      [],
      [
        story('w1', 90),
        story('w2', 80),
        story('w3', 70),
        story('b1', 50, 'brink'),
        story('f1', 40, 'faith'),
        story('t1', 30, 'threshold'),
        story('o1', 20, 'outbreak'),
      ],
      0,
    )
    expect(keys(rows)).toEqual(['w1', 'w2', 'b1', 'f1', 't1'])
  })

  it('keeps a row twenty seconds even past its story, and keeps the order', () => {
    const first = pickStories([], [story('w1', 50), story('b1', 40, 'brink')], 0)
    // A heavier story comes and the war is over: the war row stays for now, the new one joins below.
    const second = pickStories(first, [story('f1', 90, 'faith'), story('b1', 40, 'brink')], 5_000)
    expect(keys(second)).toEqual(['w1', 'b1', 'f1'])
    expect(second.find((r) => r.story.key === 'f1')?.since).toBe(5_000)
    // Once its time is up, it goes.
    const third = pickStories(second, [story('f1', 90, 'faith'), story('b1', 40, 'brink')], HOLD_MS + 1)
    expect(keys(third)).toEqual(['b1', 'f1'])
  })

  it('a full panel makes a new story wait until a row has had its time', () => {
    const five = ['a', 'b', 'c', 'd', 'e'].map((k, i) => story(k, 50 - i, `${k}` as Story['kind']))
    const shown = pickStories([], five, 0)
    const withNew = [story('n', 99, 'faith'), ...five.slice(0, 4)]
    expect(keys(pickStories(shown, withNew, 1_000))).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(keys(pickStories(shown, withNew, HOLD_MS + 1))).toEqual(['a', 'b', 'c', 'd', 'n'])
  })

  it('at most two rows about one tribe; the next story takes the place', () => {
    const rows = pickStories(
      [],
      [
        story('p1', 90, 'peril', ['g']),
        story('b1', 80, 'brink', ['g', 'a']),
        story('b2', 70, 'brink', ['g', 'b']),
        story('e1', 60, 'era', ['g']),
        story('f1', 50, 'faith', ['c']),
        story('t1', 40, 'threshold', ['a']),
        story('o1', 30, 'outbreak'),
      ],
      0,
    )
    expect(keys(rows)).toEqual(['p1', 'b1', 'f1', 't1', 'o1'])
  })

  it('a held row still counts for its tribe, so a new story about it waits', () => {
    const first = pickStories([], [story('p1', 90, 'peril', ['g']), story('b1', 80, 'brink', ['g', 'a'])], 0)
    // The feud is over, but its row is held; the tribe's new era waits for it.
    const later = [story('p1', 90, 'peril', ['g']), story('e1', 85, 'era', ['g'])]
    expect(keys(pickStories(first, later, 5_000))).toEqual(['p1', 'b1'])
    expect(keys(pickStories(first, later, HOLD_MS + 1))).toEqual(['p1', 'e1'])
  })

  it('a live world: one tribe in two rows, one row for the festival', () => {
    const w = world({
      lineage_names: { ...NAMES, g: 'Gijontum' },
      lineage_sizes: [...Object.keys(NAMES), 'g'].map((id) => ({ id, count: id === 'g' ? 3 : 10 })),
      tribal_relations: [
        { a: 'g', b: 'a', attitude: -0.9, status: 'rivals' },
        { a: 'g', b: 'b', attitude: -0.8, status: 'rivals' },
      ],
      tribes_in_peril: [
        { lineage_id: 'g', tribe: 'Gijontum', population: 3, peak: 30, cause: 'war', since: 1 },
      ],
      festivals: [
        { name: 'Spring Festival', lineage_id: 'c', x: 1, y: 1 },
        { name: 'Spring Festival', lineage_id: 'd', x: 2, y: 2 },
      ],
      active_outbreaks: [{ kind: 'plague', infected: 4, lineage_id: 'b' }],
    })
    const rows = pickStories([], observerStories(w, new StoryWatch()), 0).map((r) => r.story)
    expect(rows.length).toBeLessThanOrEqual(MAX_ROWS)
    expect(rows.filter((s) => s.tribes?.includes('g'))).toHaveLength(2)
    expect(rows.map((s) => s.title)).toEqual([
      'Gijontum is dying out: only 3 left',
      'Gijontum and Timovo: on the brink of war',
      'Epidemic: plague',
      'Spring Festival',
    ])
  })

  it('the oldest person and the largest family only while the world is quiet', () => {
    const quiet = pickStories([], [story('w1', 90), story('e1', 5, 'elder'), story('y1', 4, 'family')], 0)
    expect(keys(quiet)).toEqual(['w1', 'e1', 'y1'])
    const busy = [
      story('w1', 90),
      story('b1', 50, 'brink'),
      story('f1', 40, 'faith'),
      story('e1', 5, 'elder'),
    ]
    expect(keys(pickStories([], busy, 0))).toEqual(['w1', 'b1', 'f1'])
  })
})

describe('the memory of a world', () => {
  it('starts over when the clock goes back (another world)', () => {
    const watch = new StoryWatch()
    watch.update(world({ religions: [{ id: 'r1', name: 'x' }] }))
    watch.update(world({ tick: 10, religions: [{ id: 'r1', name: 'x' }] }))
    expect(watch.start).toBe(10)
    expect(watch.faiths.get('r1')).toBe(-Infinity)
  })
})
