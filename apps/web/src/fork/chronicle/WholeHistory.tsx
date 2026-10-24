// Fork: the "Whole history" tab of the Chronicles: every notable line the
// world has written, kept by the desktop simulation (see ./model and ./api).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calendarAt } from '../../game/model/calendar'
import { fmtNumber, t, tn } from '../../i18n'
import { displayName } from '../../i18n/names'
import { simLabel } from '../../i18n/sim'
import { sexByName } from '../../i18n/simtext'
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
  shownActor,
  tribeOptions,
  type ChronicleCategory,
  type ChronicleEntry,
  type ChronicleFilter,
  type ChronicleTribe,
  type ChronicleYear,
} from './model'
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
  const filter: ChronicleFilter = useMemo(() => ({ categories, lineage }), [categories, lineage])
  const stateRef = useRef(state)
  stateRef.current = state
  const loadingMore = useRef(false)

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

  const toggle = (c: ChronicleCategory) => {
    const next = categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c]
    const ordered = CATEGORIES.filter((x) => next.includes(x))
    saveCategories(storage(), ordered)
    setCategories(ordered)
  }

  const groups = useMemo(() => groupByYear(state.entries, state.years), [state.entries, state.years])
  const options = useMemo(() => tribeOptions(tribes, alive), [tribes, alive])
  const peaks = useMemo(() => new Map(tribes.map((tr) => [tr.id, tr.peak])), [tribes])
  const sex = sexByName(useWorldStore.getState().world?.organisms)

  return (
    <div className="fch">
      <div className="fch-filters">
        <div className="fch-chips" role="group" aria-label={t('chronicle.tab')}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={'fch-chip' + (categories.includes(c) ? ' on' : '')}
              aria-pressed={categories.includes(c)}
              onClick={() => toggle(c)}
            >
              <span style={{ color: CATEGORY_COLOR[c] }}>{CATEGORY_ICON[c]}</span> {t(CATEGORY_LABEL[c])}
            </button>
          ))}
        </div>
        <label className="fch-tribe">
          {t('chronicle.tribe')}{' '}
          <select value={lineage ?? ''} onChange={(e) => setLineage(e.target.value || null)}>
            <option value="">{t('chronicle.tribe.all')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="fch-list"
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollTop + el.clientHeight > el.scrollHeight - 400) loadMore()
        }}
      >
        {state.loading ? (
          <div className="fch-note">{t('chronicle.loading')}</div>
        ) : state.error ? (
          <div className="fch-note">{t('chronicle.unavailable', { error: state.error })}</div>
        ) : groups.length === 0 ? (
          <div className="fch-note">{t('chronicle.empty')}</div>
        ) : (
          groups.map((g) => (
            <section key={g.year} className="fch-year">
              <div className="fch-year-head">
                <span>
                  {g.era
                    ? t('chronicle.yearEra', { year: g.year + 1, era: simLabel('era', g.era) })
                    : t('chronicle.year', { year: g.year + 1 })}
                </span>
                <span className="fch-year-count">{fmtNumber(g.count)}</span>
              </div>
              {g.entries.map((e) => (
                <EntryRow key={e.id} entry={e} tribes={tribes} alive={alive} peaks={peaks} sex={sex} />
              ))}
            </section>
          ))
        )}
        {state.more && !state.loading && <div className="fch-note">⟳ {t('chronicle.loadingMore')}</div>}
      </div>
      {!state.loading && !state.error && (
        <div className="fch-foot">
          {tn('chronicle.total', state.total)}
          {state.startedTick
            ? ` · ${t('chronicle.since', { year: calendarAt(state.startedTick).year })}`
            : ''}
        </div>
      )}
    </div>
  )
}

function EntryRow({
  entry,
  tribes,
  alive,
  peaks,
  sex,
}: {
  entry: ChronicleEntry
  tribes: readonly ChronicleTribe[]
  alive: ReadonlySet<string> | null
  peaks: ReadonlyMap<string, number>
  sex: ReturnType<typeof sexByName>
}) {
  const actor = entryActor(entry)
  const tribe = liveTribe(entry, tribes, alive)
  const first = entry.tribes[0]
  const text = entryText(entry, sex, first ? (peaks.get(first.id) ?? 0) : 0)
  return (
    <div className="fch-row">
      <span className="fch-season">{seasonOf(entry.tick)}</span>
      <span className="fch-icon" style={{ color: CATEGORY_COLOR[entry.cat] ?? CATEGORY_COLOR.other }}>
        {CATEGORY_ICON[entry.cat] ?? CATEGORY_ICON.other}
      </span>
      <span className="fch-text">
        {actor && <span className="fch-actor">{shownActor(actor)} </span>}
        {text}
        {entry.restored && (
          <span className="fch-restored" title={t('chronicle.restoredTip')}>
            {' '}
            · {t('chronicle.restored')}
          </span>
        )}
      </span>
      <span className="fch-go">
        {tribe ? (
          <button
            type="button"
            className="fch-go-btn"
            title={t('chronicle.goTo', { name: displayName(tribe.name) })}
            aria-label={t('chronicle.goTo', { name: displayName(tribe.name) })}
            onClick={() => goToTribe(tribe.id)}
          >
            ▸
          </button>
        ) : (
          first && <span className="fch-gone">{t('chronicle.diedOutMark')}</span>
        )}
      </span>
    </div>
  )
}
