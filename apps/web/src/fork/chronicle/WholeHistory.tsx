// Fork: the "Whole history" tab of the Chronicles: every notable line the
// world has written, kept by the desktop simulation (see ./model and ./api).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calendarAt } from '../../game/model/calendar'
import { ft, ftn, fmtNumber } from '../i18n'
import { displayName } from '../i18n/names'
import { simLabel } from '../i18n/sim'
import { sexByName, type Sex } from '../i18n/simtext'
import type { WorldState } from '../../shared/types'
import { useWorldStore } from '../../state/worldStore'
import { fetchChroniclePage, fetchChronicleTribes } from './api'
import { goToTribe } from './navigate'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  countNewer,
  entryActor,
  entryText,
  groupByYear,
  liveTribe,
  loadCategories,
  mergeNewer,
  pageQuery,
  saveCategories,
  seasonOf,
  sentence,
  sexesOfLines,
  shownActor,
  tribeOptions,
  type ChronicleCategory,
  type ChronicleEntry,
  type ChronicleFilter,
  type ChronicleTribe,
  type ChronicleTribeLink,
  type ChronicleYear,
} from './model'
import {
  collapsePeople,
  groupText,
  memberText,
  personText,
  type PersonKind,
  type PersonLine,
  type PersonMember,
} from './people'
import './whole-history.css'

const PAGE = 200
const REFRESH_MS = 2000
const TRIBES_EVERY = 5

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Tribes with someone alive in the world on screen. */
function aliveLineages(world: WorldState | null): Set<string> | null {
  if (!world || world.organisms.length === 0) return null
  const out = new Set<string>()
  for (const o of world.organisms) if (o.alive !== false) out.add(o.lineage_id)
  return out
}

interface State {
  entries: ChronicleEntry[]
  years: ChronicleYear[]
  total: number
  startedTick: number | null
  more: boolean
  loading: boolean
  error: string | null
}

const EMPTY: State = {
  entries: [],
  years: [],
  total: 0,
  startedTick: null,
  more: false,
  loading: true,
  error: null,
}

export function WholeHistory() {
  const [categories, setCategories] = useState<ChronicleCategory[]>(() => loadCategories(storage()))
  const [lineage, setLineage] = useState<string | null>(null)
  const [state, setState] = useState<State>(EMPTY)
  const [tribes, setTribes] = useState<ChronicleTribe[]>([])
  const [alive, setAlive] = useState<Set<string> | null>(() => aliveLineages(useWorldStore.getState().world))
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set())
  const filter: ChronicleFilter = useMemo(() => ({ categories, lineage }), [categories, lineage])
  const stateRef = useRef(state)
  stateRef.current = state
  const loadingMore = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)

  // The first page whenever the filter changes.
  useEffect(() => {
    const abort = new AbortController()
    setState(EMPTY)
    if (filter.categories.length === 0) {
      setState({ ...EMPTY, loading: false })
      return () => abort.abort()
    }
    fetchChroniclePage(pageQuery(filter, { limit: PAGE }), abort.signal)
      .then((page) =>
        setState({
          entries: page.rows,
          years: page.years ?? [],
          total: page.total ?? page.rows.length,
          startedTick: page.started_tick,
          more: page.more,
          loading: false,
          error: null,
        }),
      )
      .catch((error: unknown) => {
        if (abort.signal.aborted) return
        setState({ ...EMPTY, loading: false, error: error instanceof Error ? error.message : String(error) })
      })
    return () => abort.abort()
  }, [filter])

  // New lines on top, the tribes and who is alive, every couple of seconds.
  useEffect(() => {
    const abort = new AbortController()
    let round = 0
    const refreshTribes = () =>
      fetchChronicleTribes(abort.signal)
        .then(setTribes)
        .catch(() => undefined)
    void refreshTribes()
    const timer = setInterval(() => {
      round += 1
      setAlive(aliveLineages(useWorldStore.getState().world))
      if (round % TRIBES_EVERY === 0) void refreshTribes()
      const current = stateRef.current
      if (current.loading || current.error || filter.categories.length === 0) return
      const newest = current.entries[0]?.id ?? 0
      fetchChroniclePage(pageQuery(filter, { afterId: newest, limit: PAGE }), abort.signal)
        .then((page) => {
          if (page.rows.length === 0) return
          setState((s) => {
            const have = new Set(s.entries.map((e) => e.id))
            const fresh = page.rows.filter((e) => !have.has(e.id))
            return {
              ...s,
              entries: mergeNewer(s.entries, fresh),
              years: countNewer(s.years, fresh),
              total: s.total + fresh.length,
            }
          })
        })
        .catch(() => undefined)
    }, REFRESH_MS)
    return () => {
      clearInterval(timer)
      abort.abort()
    }
  }, [filter])

  const loadMore = useCallback(() => {
    const current = stateRef.current
    const last = current.entries[current.entries.length - 1]
    if (!current.more || !last || loadingMore.current) return
    loadingMore.current = true
    fetchChroniclePage(pageQuery(filter, { before: { tick: last.tick, id: last.id }, limit: PAGE }))
      .then((page) =>
        setState((s) => {
          const have = new Set(s.entries.map((e) => e.id))
          return {
            ...s,
            entries: [...s.entries, ...page.rows.filter((e) => !have.has(e.id))],
            more: page.more,
          }
        }),
      )
      .catch(() => undefined)
      .finally(() => {
        loadingMore.current = false
      })
  }, [filter])

  // A page of people folds into a few rows: load on until the list can scroll.
  useEffect(() => {
    const el = listRef.current
    if (el && state.more && !state.loading && el.scrollHeight <= el.clientHeight + 400) loadMore()
  }, [state.entries, state.more, state.loading, loadMore])

  const toggle = (c: ChronicleCategory) => {
    const next = categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c]
    const ordered = CATEGORIES.filter((x) => next.includes(x))
    saveCategories(storage(), ordered)
    setCategories(ordered)
  }

  const groups = useMemo(
    () => groupByYear(state.entries, state.years).map((g) => ({ ...g, items: collapsePeople(g.entries) })),
    [state.entries, state.years],
  )
  const options = useMemo(() => tribeOptions(tribes, alive), [tribes, alive])
  const peaks = useMemo(() => new Map(tribes.map((tr) => [tr.id, tr.peak])), [tribes])
  const lineSexes = useMemo(() => sexesOfLines(state.entries), [state.entries])
  const worldSex = sexByName(useWorldStore.getState().world?.organisms)
  const sex = (name: string): Sex | null => worldSex(name) ?? lineSexes.get(name) ?? null
  const flip = (key: string) =>
    setOpened((was) => {
      const next = new Set(was)
      if (!next.delete(key)) next.add(key)
      return next
    })

  return (
    <div className="fch">
      <div className="fch-filters">
        <div className="fch-chips" role="group" aria-label={ft('chronicle.tab')}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={'fch-chip' + (categories.includes(c) ? ' on' : '')}
              aria-pressed={categories.includes(c)}
              onClick={() => toggle(c)}
            >
              <span style={{ color: CATEGORY_COLOR[c] }}>{CATEGORY_ICON[c]}</span> {ft(CATEGORY_LABEL[c])}
            </button>
          ))}
        </div>
        <label className="fch-tribe">
          {ft('chronicle.tribe')}{' '}
          <select value={lineage ?? ''} onChange={(e) => setLineage(e.target.value || null)}>
            <option value="">{ft('chronicle.tribe.all')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        ref={listRef}
        className="fch-list"
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollTop + el.clientHeight > el.scrollHeight - 400) loadMore()
        }}
      >
        {state.loading ? (
          <div className="fch-note">{ft('chronicle.loading')}</div>
        ) : state.error ? (
          <div className="fch-note">{ft('chronicle.unavailable', { error: state.error })}</div>
        ) : groups.length === 0 ? (
          <div className="fch-note">{ft('chronicle.empty')}</div>
        ) : (
          groups.map((g) => (
            <section key={g.year} className="fch-year">
              <div className="fch-year-head">
                <span>
                  {g.era
                    ? ft('chronicle.yearEra', { year: g.year + 1, era: simLabel('era', g.era) })
                    : ft('chronicle.year', { year: g.year + 1 })}
                </span>
                <span className="fch-year-count">{fmtNumber(g.count)}</span>
              </div>
              {g.items.map((item) =>
                item.type === 'entry' ? (
                  <EntryRow
                    key={item.entry.id}
                    entry={item.entry}
                    line={item.line}
                    tribes={tribes}
                    alive={alive}
                    peaks={peaks}
                    sex={sex}
                  />
                ) : (
                  <PeopleRow
                    key={item.key}
                    kind={item.kind}
                    tick={item.tick}
                    members={item.members}
                    open={opened.has(item.key)}
                    onFlip={() => flip(item.key)}
                    tribes={tribes}
                    alive={alive}
                    sex={sex}
                  />
                ),
              )}
            </section>
          ))
        )}
        {state.more && !state.loading && <div className="fch-note">⟳ {ft('chronicle.loadingMore')}</div>}
      </div>
      {!state.loading && !state.error && (
        <div className="fch-foot">
          {ftn('chronicle.total', state.total)}
          {state.startedTick
            ? ` · ${ft('chronicle.since', { year: calendarAt(state.startedTick).year })}`
            : ''}
        </div>
      )}
    </div>
  )
}

type SexOf = (name: string) => Sex | null

function EntryRow({
  entry,
  line,
  tribes,
  alive,
  peaks,
  sex,
}: {
  entry: ChronicleEntry
  line: PersonLine | null
  tribes: readonly ChronicleTribe[]
  alive: ReadonlySet<string> | null
  peaks: ReadonlyMap<string, number>
  sex: SexOf
}) {
  const actor = entryActor(entry)
  const tribe = liveTribe(entry, tribes, alive)
  const first = entry.tribes[0]
  const peak = first ? (peaks.get(first.id) ?? 0) : 0
  const text = line ? personText({ entry, line }, sex, peak) : entryText(entry, sex, peak)
  return (
    <div className="fch-row">
      <span className="fch-season">{seasonOf(entry.tick)}</span>
      <span className="fch-icon" style={{ color: CATEGORY_COLOR[entry.cat] ?? CATEGORY_COLOR.other }}>
        {CATEGORY_ICON[entry.cat] ?? CATEGORY_ICON.other}
      </span>
      <span className="fch-text">
        {actor && <span className="fch-actor">{shownActor(actor)} </span>}
        {actor ? text : sentence(text)}
        {entry.restored && (
          <span className="fch-restored" title={ft('chronicle.restoredTip')}>
            {' '}
            · {ft('chronicle.restored')}
          </span>
        )}
      </span>
      <GoTo tribe={tribe} gone={!!first} />
    </div>
  )
}

/** The ▸ to a tribe on the map, or «(вымерли)» when the line's tribes have nobody left. */
function GoTo({ tribe, gone }: { tribe: ChronicleTribeLink | null; gone: boolean }) {
  return (
    <span className="fch-go">
      {tribe ? (
        <button
          type="button"
          className="fch-go-btn"
          title={ft('chronicle.goTo', { name: displayName(tribe.name) })}
          aria-label={ft('chronicle.goTo', { name: displayName(tribe.name) })}
          onClick={() => goToTribe(tribe.id)}
        >
          ▸
        </button>
      ) : (
        gone && <span className="fch-gone">{ft('chronicle.diedOutMark')}</span>
      )}
    </span>
  )
}

/** A season's deaths or new elders in one row, opened to the names. */
function PeopleRow({
  kind,
  tick,
  members,
  open,
  onFlip,
  tribes,
  alive,
  sex,
}: {
  kind: PersonKind
  tick: number
  members: readonly PersonMember[]
  open: boolean
  onFlip: () => void
  tribes: readonly ChronicleTribe[]
  alive: ReadonlySet<string> | null
  sex: SexOf
}) {
  // The ▸ when everyone was of one tribe that still has people.
  const live = members.map((m) => liveTribe(m.entry, tribes, alive))
  const tribe = live.every((tr) => tr && tr.id === live[0]?.id) ? live[0] : null
  const gone = members.every((m) => m.entry.tribes.length > 0)
  return (
    <div className="fch-people">
      <div className="fch-row">
        <span className="fch-season">{seasonOf(tick)}</span>
        <span className="fch-icon" style={{ color: CATEGORY_COLOR.people }}>
          {CATEGORY_ICON.people}
        </span>
        <span className="fch-text">
          <button
            type="button"
            className="fch-people-head"
            aria-expanded={open}
            title={open ? ft('chronicle.people.close') : ft('chronicle.people.open')}
            onClick={onFlip}
          >
            <span className="fch-people-mark">{open ? '▾' : '▸'}</span> {groupText(kind, members)}
          </button>
        </span>
        <GoTo tribe={tribe} gone={gone && live.every((tr) => !tr)} />
      </div>
      {open && (
        <ul className="fch-people-list">
          {members.map((m) => (
            <li key={m.entry.id}>
              {memberText(m, sex)}
              {m.entry.restored && (
                <span className="fch-restored" title={ft('chronicle.restoredTip')}>
                  {' '}
                  · {ft('chronicle.restored')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
