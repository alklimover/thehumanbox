import { useMemo, useState } from 'react'
import type { WorldState } from '../../shared/types'
import type { LineageStrategy } from '../../simulation/sandbox'
import { Modal } from './Modal'
import { askConfirm } from '../../shared/confirm'
import { normalizeLineageEras } from '../../shared/lineageEras'
import { useSceneStore } from '../../state/scene'
import { farmStage } from '../../game/model/farms'
import { getBuildingState } from '../../game/model/building-state'
import { moonPhaseName } from '../../game/model/calendar'
import { fmtNumber, t, tn, type MessageKey } from '../../i18n'
import { cargoLabel, simLabel, simLabelAsSent } from '../../i18n/sim'

interface Props {
  world: WorldState
  onClose: () => void
  onGuide?: (lineageId: string, strategy: LineageStrategy) => Promise<boolean>
}

const GUIDANCE: Array<{
  value: LineageStrategy
  label: string
  description: string
  reward: string
}> = [
  {
    value: 'hunt',
    label: t('civ.guide.hunt.label'),
    description: t('civ.guide.hunt.description'),
    reward: t('civ.guide.hunt.reward'),
  },
  {
    value: 'explore',
    label: t('civ.guide.explore.label'),
    description: t('civ.guide.explore.description'),
    reward: t('civ.guide.explore.reward'),
  },
  {
    value: 'settle',
    label: t('civ.guide.settle.label'),
    description: t('civ.guide.settle.description'),
    reward: t('civ.guide.settle.reward'),
  },
  {
    value: 'trade',
    label: t('civ.guide.trade.label'),
    description: t('civ.guide.trade.description'),
    reward: t('civ.guide.trade.reward'),
  },
  {
    value: 'defend',
    label: t('civ.guide.defend.label'),
    description: t('civ.guide.defend.description'),
    reward: t('civ.guide.defend.reward'),
  },
]

// The simulation's season ids (the cosmos calendar), named as this window has always shown them.
const SEASON_KEYS: Record<string, MessageKey> = {
  abundance: 'civ.season.abundance',
  decline: 'civ.season.decline',
  scarcity: 'civ.season.scarcity',
  recovery: 'civ.season.recovery',
}

// Battle sizes as the simulation sends them (the Rust enum names).
const SCALE_KEYS: Record<string, MessageKey> = {
  Skirmish: 'civ.scale.Skirmish',
  Raid: 'civ.scale.Raid',
  Siege: 'civ.scale.Siege',
  Battle: 'civ.scale.Battle',
  War: 'civ.scale.War',
}

const OUTCOME_KEYS: Record<string, MessageKey> = {
  completed: 'civ.outcome.completed',
  expired: 'civ.outcome.expired',
  redirected: 'civ.outcome.redirected',
  failed: 'civ.outcome.failed',
}

// Book topics (BookTopic::name in the simulation).
const TOPIC_KEYS: Record<string, MessageKey> = {
  history: 'civ.topic.history',
  philosophy: 'civ.topic.philosophy',
  science: 'civ.topic.science',
  medicine: 'civ.topic.medicine',
  religion: 'civ.topic.religion',
  poetry: 'civ.topic.poetry',
  law: 'civ.topic.law',
  engineering: 'civ.topic.engineering',
  geography: 'civ.topic.geography',
  mathematics: 'civ.topic.mathematics',
  astronomy: 'civ.topic.astronomy',
  fiction: 'civ.topic.fiction',
  biography: 'civ.topic.biography',
  economics: 'civ.topic.economics',
  drama: 'civ.topic.drama',
}

/** A faith's name in the player's language; a duplicate keeps its " rel7" suffix as sent. */
function religionName(name: string): string {
  const match = /^(.*) (rel\d+)$/.exec(name)
  return match ? `${simLabel('religion', match[1])} ${match[2]}` : simLabel('religion', name)
}

/** The words for a simulation value from one of the tables above, or the value itself when unknown. */
function keyed(keys: Record<string, MessageKey>, value: string | null | undefined): string {
  if (!value) return ''
  const key = keys[value]
  return key ? t(key) : value
}

function hasEnterableBuilding(world: WorldState, kinds: ReadonlySet<string>, lineageId: string): boolean {
  const matching = (world.buildings ?? []).filter((building) => {
    if (!kinds.has(building.kind.toLowerCase())) return false
    const owner = building.lineage_id ?? building.owner_lineage
    return !owner || owner === lineageId
  })
  // Older snapshots did not carry all building records and use the scene
  // resolver's lineage-centroid fallback. Only an explicitly ruined record
  // suppresses that legacy path.
  return matching.length === 0 || matching.some((building) => getBuildingState(building).isOperational)
}

const TAVERN_BUILDINGS = new Set(['tavern'])
const TEMPLE_BUILDINGS = new Set(['temple', 'cathedral', 'shrine', 'mosque', 'synagogue', 'pagoda'])

const ERA_EMOJI: Record<string, string> = {
  'pre-stone': '\u{1F33F}',
  stone: '\u{1FAA8}',
  bronze: '\u{1F33E}',
  iron: '\u{2694}\u{FE0F}',
  classical: '\u{1F3DB}\u{FE0F}',
  medieval: '\u{1F3F0}',
  renaissance: '\u{1F3A8}',
  industrial: '\u{1F3ED}',
  modern: '\u{1F697}',
  information: '\u{1F4BB}',
}

const GOV_EMOJI: Record<string, string> = {
  tribal: '\u{1F525}',
  chiefdom: '\u{1FAA9}',
  monarchy: '\u{1F451}',
  theocracy: '\u{271D}\u{FE0F}',
  republic: '\u{1F3DB}\u{FE0F}',
  democracy: '\u{1F5F3}\u{FE0F}',
  empire: '\u{1F985}',
  federation: '\u{1F30E}',
  corporate: '\u{1F3E2}',
}

const GOOD_EMOJI: Record<string, string> = {
  food: '\u{1F35E}',
  water: '\u{1F4A7}',
  wood: '\u{1FAB5}',
  stone: '\u{1FAA8}',
  iron: '\u{1F528}',
  cloth: '\u{1F9F5}',
  bread: '\u{1F35E}',
  spirit: '\u{1F943}',
  aged_spirit: '\u{1F6E2}\u{FE0F}',
  bottled_spirit: '\u{1F37E}',
  blended_spirit: '\u{1F377}',
  bottle: '\u{1F376}',
  meat: '\u{1F969}',
  cuts: '\u{1F52A}',
  ground: '\u{1F356}',
  sausage: '\u{1F32D}',
  preserved: '\u{1F9C2}',
  preserved_meat: '\u{1F9C2}',
  pattern: '\u{1F4D0}',
  piece: '\u{1F9F5}',
  garment: '\u{1F455}',
  article: '\u{1F4F0}',
  drink: '\u{1F375}',
  pastry: '\u{1F950}',
  coffee: '\u{2615}',
  stock: '\u{1F4E6}',
}

const ART_EMOJI: Record<string, string> = {
  cave_painting: '\u{1F58C}\u{FE0F}',
  sculpture: '\u{1F5FF}',
  fresco: '\u{1F3DB}\u{FE0F}',
  painting: '\u{1F5BC}\u{FE0F}',
  photograph: '\u{1F4F7}',
  film: '\u{1F3AC}',
  digital: '\u{1F5A5}\u{FE0F}',
}

export function CivStatsModal({ world, onClose, onGuide }: Props) {
  const [guidanceBusy, setGuidanceBusy] = useState<Record<string, boolean>>({})
  const [guidanceResult, setGuidanceResult] = useState<Record<string, string>>({})
  const [showAllCampaigns, setShowAllCampaigns] = useState(false)
  const lineages = world.lineage_sizes ?? []
  const lineageNames = world.lineage_names ?? {}
  const lineageEras = normalizeLineageEras(world.lineage_eras)
  const eraProgress = new Map((world.lineage_era_progress ?? []).map((p) => [p.lineage_id, p]))
  const currencies = (world.lineage_currencies ?? {}) as Record<string, string>
  const governments = world.governments ?? []
  const religions = world.religions ?? []
  const books = world.books ?? []
  const artworks = world.artworks ?? []
  const headlines = world.headlines ?? []
  const battles = world.battles ?? []
  const treaties = world.treaties ?? []
  const campaignHistory = world.lineage_strategy_history ?? []
  const tradeRoutes = world.trade_routes ?? []
  const caravans = world.caravans ?? []

  const lineageById = (lid: string) => lineageNames[lid] ?? lid.slice(0, 6)
  const activeStrategyFor = (lineageId: string) => {
    const strategy = world.lineage_strategies?.[lineageId]
    return strategy && strategy.expires_tick > world.tick ? strategy : undefined
  }
  const guideLineage = async (lineageId: string, strategy: LineageStrategy) => {
    if (!onGuide || guidanceBusy[lineageId]) return
    const active = activeStrategyFor(lineageId)
    if (
      active &&
      !active.completed &&
      active.strategy !== strategy &&
      !(await askConfirm({
        title: t('civ.guide.confirmTitle'),
        body: t('civ.guide.confirmBody', {
          tribe: lineageById(lineageId),
          from: simLabel('strategy', active.strategy),
          to: simLabel('strategy', strategy),
        }),
        confirmLabel: t('civ.guide.confirmLabel'),
      }))
    ) {
      return
    }

    setGuidanceBusy((current) => ({ ...current, [lineageId]: true }))
    setGuidanceResult((current) => ({ ...current, [lineageId]: t('civ.guide.busy') }))
    void onGuide(lineageId, strategy)
      .then((ok) => {
        setGuidanceResult((current) => ({
          ...current,
          [lineageId]: ok
            ? t('civ.guide.started', { strategy: simLabel('strategy', strategy) })
            : t('civ.guide.rejected'),
        }))
      })
      .catch(() => {
        setGuidanceResult((current) => ({ ...current, [lineageId]: t('civ.guide.unavailable') }))
      })
      .finally(() => {
        setGuidanceBusy((current) => ({ ...current, [lineageId]: false }))
      })
  }
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of world.organisms) m.set(o.id, o.name)
    return m
  }, [world.organisms])
  const orgById = (id: string | null | undefined) => {
    if (!id) return null
    return nameById.get(id) ?? id.slice(0, 6)
  }

  const { buildingRows, buildingOverflow } = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of world.buildings ?? []) {
      counts[b.kind] = (counts[b.kind] ?? 0) + 1
    }
    const all = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const CAP = 28
    return { buildingRows: all.slice(0, CAP), buildingOverflow: all.length - Math.min(all.length, CAP) }
  }, [world.buildings])

  const farmSummary = useMemo(() => {
    const stages = { fallow: 0, growing: 0, mature: 0 }
    const crops = new Map<string, number>()
    let projectedYield = 0
    for (const farm of world.farms ?? []) {
      const stage = farmStage(farm, world.tick)
      if (stage === 'fallow' || stage === 'harvested') stages.fallow++
      else if (stage === 'mature') stages.mature++
      else stages.growing++
      if (farm.crop && stage !== 'fallow' && stage !== 'harvested') {
        crops.set(farm.crop, (crops.get(farm.crop) ?? 0) + 1)
      }
      if (stage === 'mature') projectedYield += farm.yield ?? 0
    }
    return {
      stages,
      projectedYield,
      crops: [...crops.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [world.farms, world.tick])

  const { goodsByLineage, goodsTotalRows, goodsOverflow } = useMemo(() => {
    const isDisplayableGood = (k: string) => /^[a-z][a-z0-9_]*$/.test(k)
    const byLineage = new Map<string, Map<string, number>>()
    for (const o of world.organisms) {
      if (!o.alive || !o.tools) continue
      const lid = o.lineage_id
      let bag = byLineage.get(lid)
      if (!bag) {
        bag = new Map<string, number>()
        byLineage.set(lid, bag)
      }
      for (const [k, v] of Object.entries(o.tools)) {
        if (!v || !isDisplayableGood(k)) continue
        bag.set(k, (bag.get(k) ?? 0) + v)
      }
    }
    const totals = new Map<string, number>()
    for (const bag of byLineage.values()) {
      for (const [k, v] of bag) {
        totals.set(k, (totals.get(k) ?? 0) + v)
      }
    }
    const CAP = 36
    const all = [...totals.entries()].sort((a, b) => b[1] - a[1])
    return {
      goodsByLineage: byLineage,
      goodsTotalRows: all.slice(0, CAP),
      goodsOverflow: all.length - Math.min(all.length, CAP),
    }
  }, [world.organisms])

  const moonGlyphs: Record<string, string> = {
    new_moon: '🌑',
    waxing_crescent: '🌒',
    first_quarter: '🌓',
    waxing_gibbous: '🌔',
    full_moon: '🌕',
    waning_gibbous: '🌖',
    last_quarter: '🌗',
    waning_crescent: '🌘',
  }

  return (
    <Modal open onClose={onClose} className="civ-modal" title={`\u{1F30D} ${t('civ.title')}`}>
      <button aria-label={t('common.close')} className="close-btn civ-close" onClick={onClose}>
        ✕
      </button>
      {world.cosmos && (
        <div className="civ-calendar">
          <div className="civ-cal-item">
            <span className="civ-cal-label">{t('civ.cal.year')}</span>
            <span className="civ-cal-value">{fmtNumber(world.cosmos.year + 1)}</span>
            <span className="civ-cal-sub">{t('civ.cal.dayOf', { day: world.cosmos.day_of_year + 1 })}</span>
          </div>
          <span className="civ-cal-sep" aria-hidden="true" />
          <div className="civ-cal-item">
            <span className="civ-cal-moon">{moonGlyphs[world.cosmos.moon_phase] ?? '🌑'}</span>
            <span className="civ-cal-value">{moonPhaseName(world.cosmos.moon_phase)}</span>
            <span className="civ-cal-sub">
              {t('civ.cal.lit', { percent: Math.round(world.cosmos.moon_illum * 100) })}
            </span>
          </div>
          <span className="civ-cal-sep" aria-hidden="true" />
          <div className="civ-cal-item">
            <span className="civ-cal-label">{t('civ.cal.season')}</span>
            <span className="civ-cal-value">{keyed(SEASON_KEYS, world.season)}</span>
          </div>
          {world.current_era && (
            <>
              <span className="civ-cal-sep" aria-hidden="true" />
              <div className="civ-cal-item">
                <span className="civ-cal-label">{t('civ.cal.worldTech')}</span>
                <span className="civ-cal-value">{simLabelAsSent('era', world.current_era)}</span>
              </div>
            </>
          )}
        </div>
      )}
      <div className="civ-modal-grid">
        <div className="civ-cols">
          <section className="civ-section civ-section--span">
            <h3>{t('civ.lineages.title')}</h3>
            <div className="civ-table-wrap">
              <table className="civ-table" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader">{t('civ.col.name')}</th>
                    <th role="columnheader">{t('civ.col.era')}</th>
                    <th role="columnheader">{t('civ.col.pop')}</th>
                    <th role="columnheader">{t('civ.col.next')}</th>
                    <th role="columnheader">{t('civ.col.gov')}</th>
                    <th role="columnheader">{t('civ.col.currency')}</th>
                    <th role="columnheader" aria-label={t('civ.col.actions')}></th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {lineages.slice(0, 12).map((l) => {
                    const era = lineageEras[l.id] ?? 'pre-stone'
                    const progress = eraProgress.get(l.id)
                    const worldPopulation = progress?.world_population ?? progress?.pop ?? 0
                    const worldPopulationRequired =
                      progress?.world_population_required ?? progress?.pop_required ?? 0
                    const worldPopulationReady =
                      progress?.world_population_ready ?? progress?.pop_ready ?? true
                    const gov = governments.find((g) => g.lineage_id === l.id)
                    const activeStrategy = activeStrategyFor(l.id)
                    const objectiveProgress = activeStrategy?.progress ?? 0
                    const objectiveTarget = activeStrategy?.target ?? 0
                    const objectivePercent =
                      objectiveTarget > 0
                        ? Math.max(0, Math.min(100, Math.round((objectiveProgress / objectiveTarget) * 100)))
                        : 0
                    // `discoveries` is a cold field the server omits with
                    // `skip_serializing_if`, so it is genuinely absent on
                    // periodic full frames. `OrgCard` and the other 15 call
                    // sites already guard this; this was the one that did
                    // not, and a throw here propagates to the top-level
                    // ErrorBoundary and replaces the whole app.
                    const hasBrewing = world.organisms.some(
                      (o) => o.alive && o.lineage_id === l.id && (o.discoveries ?? []).includes('brewing'),
                    )
                    const canEnterTavern = hasEnterableBuilding(world, TAVERN_BUILDINGS, l.id)
                    return (
                      <tr key={l.id} role="row">
                        <td role="cell" data-label={t('civ.col.name')}>
                          {lineageById(l.id)}
                        </td>
                        <td role="cell" data-label={t('civ.col.era')}>
                          {ERA_EMOJI[era] ?? ''} {simLabelAsSent('era', era)}
                        </td>
                        <td role="cell" data-label={t('civ.col.pop')}>
                          {fmtNumber(l.count)}
                        </td>
                        <td role="cell" data-label={t('civ.col.next')}>
                          {progress?.next_era ? (
                            <div className="civ-era-progress">
                              <span className={progress.ready ? 'civ-era-ready' : 'civ-era-next'}>
                                {simLabelAsSent('era', progress.next_era)}
                              </span>
                              {!worldPopulationReady && (
                                <span className="civ-era-gate">
                                  {t('civ.worldPopulation', {
                                    current: worldPopulation,
                                    required: worldPopulationRequired,
                                  })}
                                </span>
                              )}
                              {progress.missing.length > 0 && (
                                <span className="civ-era-missing">
                                  {t('civ.missing', {
                                    list: progress.missing
                                      .slice(0, 3)
                                      .map((d) => simLabel('discovery', d))
                                      .join(', '),
                                  })}
                                  {progress.missing.length > 3 ? ' +' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="civ-era-next">-</span>
                          )}
                        </td>
                        <td role="cell" data-label={t('civ.col.gov')}>
                          {gov ? `${GOV_EMOJI[gov.kind] ?? ''} ${simLabel('government', gov.kind)}` : '-'}
                        </td>
                        <td role="cell" data-label={t('civ.col.currency')}>
                          {currencies[l.id] ? simLabel('currency', currencies[l.id]) : '-'}
                        </td>
                        <td
                          role="cell"
                          data-label={t('civ.col.actions')}
                          className={
                            activeStrategy || (hasBrewing && canEnterTavern)
                              ? 'civ-cell-actions'
                              : 'civ-cell-actions civ-cell-actions--empty'
                          }
                        >
                          <div className="civ-lineage-actions">
                            {activeStrategy && (
                              <span
                                className={
                                  activeStrategy.completed
                                    ? 'civ-strategy-active civ-strategy-complete'
                                    : 'civ-strategy-active'
                                }
                              >
                                {simLabel('strategy', activeStrategy.strategy)} {objectivePercent}%
                              </span>
                            )}
                            {hasBrewing && canEnterTavern && (
                              <button
                                className="civ-row-link"
                                onClick={() => {
                                  useSceneStore.getState().enter({ kind: 'tavern', lineageId: l.id })
                                  onClose()
                                }}
                              >
                                🍻 {t('civ.tavern')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="civ-campaign-board">
              <div className="civ-campaign-board-heading">
                <div>
                  <span className="civ-campaign-board-kicker">{t('civ.board.kicker')}</span>
                  <h4>{t('civ.board.title')}</h4>
                </div>
                <span className="civ-campaign-board-help">{t('civ.board.help')}</span>
              </div>
              <div className="civ-campaign-cards">
                {lineages.map((lineage) => {
                  const active = activeStrategyFor(lineage.id)
                  const meta = GUIDANCE.find((entry) => entry.value === active?.strategy)
                  const progress = active?.progress ?? 0
                  const target = active?.target ?? 0
                  const percent =
                    target > 0 ? Math.max(0, Math.min(100, Math.round((progress / target) * 100))) : 0
                  const remaining = active ? Math.max(0, active.expires_tick - world.tick) : 0
                  return (
                    <article
                      key={lineage.id}
                      className={`civ-campaign-card${active?.completed ? ' completed' : ''}`}
                    >
                      <div className="civ-campaign-card-head">
                        <div>
                          <span className="civ-campaign-lineage">{lineageById(lineage.id)}</span>
                          <span className="civ-campaign-pop">{tn('civ.people', lineage.count)}</span>
                        </div>
                        {active ? (
                          <span className="civ-campaign-badge">
                            {active.completed
                              ? t('civ.campaign.completed')
                              : (meta?.label ?? simLabel('strategy', active.strategy))}
                          </span>
                        ) : (
                          <span className="civ-campaign-badge idle">{t('civ.campaign.awaiting')}</span>
                        )}
                      </div>

                      {active ? (
                        <>
                          <p className="civ-campaign-description">
                            {meta?.description ??
                              t('civ.campaign.focusOn', { strategy: simLabel('strategy', active.strategy) })}
                          </p>
                          <div className="civ-campaign-progress-copy">
                            <span>{t('civ.campaign.progress', { progress, target })}</span>
                            <span>
                              {active.completed
                                ? t('civ.campaign.rewardEarned')
                                : tn('civ.campaign.ticksLeft', remaining)}
                            </span>
                          </div>
                          <span
                            className="civ-campaign-card-progress"
                            role="progressbar"
                            aria-label={t('civ.campaign.aria', {
                              tribe: lineageById(lineage.id),
                              strategy: simLabel('strategy', active.strategy),
                            })}
                            aria-valuemin={0}
                            aria-valuemax={target}
                            aria-valuenow={Math.min(progress, target)}
                          >
                            <span style={{ width: `${percent}%` }} />
                          </span>
                          <span className="civ-campaign-reward">
                            {t('civ.campaign.reward', {
                              reward: meta?.reward ?? t('civ.campaign.defaultReward'),
                            })}
                          </span>
                        </>
                      ) : (
                        <p className="civ-campaign-description">{t('civ.campaign.idle')}</p>
                      )}

                      <div className="civ-campaign-card-actions">
                        {onGuide && (
                          <select
                            className="civ-guide-select"
                            aria-label={t('civ.campaign.guideAria', { tribe: lineageById(lineage.id) })}
                            value=""
                            disabled={Boolean(guidanceBusy[lineage.id])}
                            onChange={(event) => {
                              const strategy = event.target.value as LineageStrategy
                              if (strategy) guideLineage(lineage.id, strategy)
                            }}
                          >
                            <option value="">
                              {active ? t('civ.campaign.change') : t('civ.campaign.start')}
                            </option>
                            {GUIDANCE.map((strategy) => (
                              <option key={strategy.value} value={strategy.value}>
                                {strategy.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {guidanceResult[lineage.id] && (
                          <span className="civ-strategy-status" role="status">
                            {guidanceResult[lineage.id]}
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
            {campaignHistory.length > 0 && (
              <div className="civ-campaign-history">
                <div className="civ-campaign-history-head">
                  <span className="civ-campaign-history-title">{t('civ.history.title')}</span>
                  {campaignHistory.length > 6 && (
                    <button
                      type="button"
                      className="civ-campaign-history-toggle"
                      onClick={() => setShowAllCampaigns((current) => !current)}
                    >
                      {showAllCampaigns
                        ? t('civ.history.showRecent')
                        : t('civ.history.showAll', { n: campaignHistory.length })}
                    </button>
                  )}
                </div>
                <div className="civ-campaign-history-list">
                  {(showAllCampaigns ? campaignHistory : campaignHistory.slice(0, 6)).map((campaign) => {
                    const icon =
                      campaign.outcome === 'completed' ? '✓' : campaign.outcome === 'redirected' ? '↪' : '×'
                    return (
                      <div
                        key={`${campaign.lineage_id}:${campaign.started_tick}:${campaign.ended_tick}:${campaign.strategy}:${campaign.outcome}`}
                        className={`civ-campaign-record civ-campaign-record--${campaign.outcome}`}
                      >
                        <span className="civ-campaign-outcome" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="civ-campaign-name">
                          {campaign.lineage_name || lineageById(campaign.lineage_id)} ·{' '}
                          {simLabel('strategy', campaign.strategy)}
                        </span>
                        <span className="civ-campaign-result">
                          {campaign.reason === 'lineage_extinct'
                            ? t('civ.history.extinct')
                            : keyed(OUTCOME_KEYS, campaign.outcome)}
                        </span>
                        <span className="civ-campaign-effort">
                          {campaign.progress}/{campaign.target}
                        </span>
                        <span className="civ-campaign-tick">
                          {t('civ.history.tick', { tick: campaign.ended_tick })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="civ-section">
            <h3>{t('civ.gov.title')}</h3>
            {governments.length === 0 && <div className="civ-empty">{t('civ.gov.empty')}</div>}
            {governments.map((g) => (
              <div key={g.lineage_id} className="civ-row">
                <span className="civ-row-head">
                  {GOV_EMOJI[g.kind] ?? ''} {simLabel('government', g.kind)}
                </span>
                <span className="civ-row-sub">{lineageById(g.lineage_id)}</span>
                {g.leader_id && (
                  <span className="civ-row-tag">
                    {t('civ.gov.leader', { name: orgById(g.leader_id) ?? '' })}
                  </span>
                )}
                {typeof g.treasury === 'number' && (
                  <span className="civ-row-tag">{t('civ.gov.treasury', { n: g.treasury })}</span>
                )}
                {g.laws && g.laws.length > 0 && (
                  <div className="civ-row-laws">
                    {g.laws.map((l) => (
                      <span key={l} className="civ-chip">
                        {simLabel('law', l)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          <section className="civ-section">
            <h3>{t('civ.religion.title')}</h3>
            {religions.length === 0 && <div className="civ-empty">{t('civ.religion.empty')}</div>}
            {religions.map((r) => {
              const lineageId = r.founder_lineage ?? r.lineage_id ?? ''
              const canEnterTemple = hasEnterableBuilding(world, TEMPLE_BUILDINGS, lineageId)
              return (
                <div key={r.id} className="civ-row">
                  <span className="civ-row-head">
                    {'\u{271D}\u{FE0F}'} {religionName(r.name)}
                  </span>
                  <span className="civ-row-sub">{simLabel('religion', r.kind)}</span>
                  <span className="civ-row-tag">{tn('civ.religion.adherents', r.adherents ?? 0)}</span>
                  <span className="civ-row-tag">
                    {t('civ.religion.foundedBy', { tribe: lineageById(lineageId) })}
                  </span>
                  {canEnterTemple ? (
                    <button
                      className="civ-row-link"
                      onClick={() => {
                        useSceneStore.getState().enter({ kind: 'temple', religionId: r.id })
                        onClose()
                      }}
                    >
                      {t('civ.religion.enterTemple')}
                    </button>
                  ) : (
                    <span className="civ-row-tag">{t('civ.religion.noTemple')}</span>
                  )}
                </div>
              )
            })}
          </section>

          <section className="civ-section">
            <h3>{t('civ.conflict.title')}</h3>
            {battles.length === 0 && <div className="civ-empty">{t('civ.conflict.empty')}</div>}
            {battles.map((b) => {
              const atk = b.attackers.map(lineageById).join(', ')
              const def = b.defenders.map(lineageById).join(', ')
              const outcomeLabel =
                b.outcome === 'AttackerVictory'
                  ? t('civ.conflict.won', { side: atk })
                  : b.outcome === 'DefenderVictory'
                    ? t('civ.conflict.won', { side: def })
                    : b.outcome === 'Stalemate'
                      ? t('civ.conflict.stalemate')
                      : null
              return (
                <div key={b.id} className="civ-row">
                  <span className="civ-row-head">
                    {'\u{2694}\u{FE0F}'} {keyed(SCALE_KEYS, b.scale)}
                  </span>
                  <span className="civ-row-sub">
                    {t('civ.conflict.vs', { attackers: atk, defenders: def })}
                  </span>
                  <span className="civ-row-tag">
                    {'\u{1F480}'} {fmtNumber(b.casualties_a + b.casualties_d)}
                  </span>
                  <span className="civ-row-tag">
                    {b.ended ? (outcomeLabel ?? t('civ.conflict.ended')) : t('civ.conflict.ongoing')}
                  </span>
                </div>
              )
            })}
          </section>

          <section className="civ-section">
            <h3>{t('civ.diplomacy.title')}</h3>
            {treaties.length === 0 && <div className="civ-empty">{t('civ.diplomacy.empty')}</div>}
            {treaties.map((treaty, i) => (
              <div key={`${treaty.a_lineage}-${treaty.b_lineage}-${i}`} className="civ-row">
                <span className="civ-row-head">
                  {'\u{1F91D}'} {lineageById(treaty.a_lineage)} &amp; {lineageById(treaty.b_lineage)}
                </span>
                <span className="civ-row-tag">
                  {treaty.kind ? simLabel('treaty', treaty.kind) : t('civ.diplomacy.treaty')}
                </span>
              </div>
            ))}
          </section>

          <section className="civ-section">
            <h3>{t('civ.buildings.title')}</h3>
            {buildingRows.length === 0 && <div className="civ-empty">{t('civ.buildings.empty')}</div>}
            <div className="civ-build-grid">
              {buildingRows.map(([kind, count]) => (
                <span key={kind} className="civ-chip">
                  {simLabel('building', kind)}: {fmtNumber(count)}
                </span>
              ))}
              {buildingOverflow > 0 && (
                <span className="civ-chip">{t('civ.more', { n: buildingOverflow })}</span>
              )}
            </div>
          </section>

          <section className="civ-section">
            <h3>{t('civ.settlements.title')}</h3>
            {!world.settlements?.length ? (
              <div className="civ-empty">{t('civ.settlements.empty')}</div>
            ) : (
              world.settlements.map((settlement) => (
                <div key={settlement.lineage_id} className="civ-row">
                  <span className="civ-row-head">
                    {settlement.tier >= 5 ? '🏙️' : settlement.tier >= 3 ? '🏘️' : '⛺'} {settlement.name}
                  </span>
                  <span className="civ-row-sub">{simLabel('settlement', settlement.tier_name)}</span>
                  <span className="civ-row-tag">{tn('civ.people', settlement.population)}</span>
                  <span className="civ-row-tag">
                    {tn('civ.settlements.buildings', settlement.building_count)}
                  </span>
                  {settlement.capacity > 0 && (
                    <span className="civ-row-tag">
                      {t('civ.settlements.capacity', { n: settlement.capacity })}
                    </span>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="civ-section">
            <h3>{t('civ.farms.title')}</h3>
            {!world.farms?.length ? (
              <div className="civ-empty">{t('civ.farms.empty')}</div>
            ) : (
              <>
                <div className="civ-build-grid">
                  <span className="civ-chip">
                    🌱 {t('civ.farms.growing', { n: farmSummary.stages.growing })}
                  </span>
                  <span className="civ-chip">
                    🌾 {t('civ.farms.ready', { n: farmSummary.stages.mature })}
                  </span>
                  <span className="civ-chip">
                    🟫 {t('civ.farms.fallow', { n: farmSummary.stages.fallow })}
                  </span>
                  {farmSummary.projectedYield > 0 && (
                    <span className="civ-chip">
                      {t('civ.farms.projected', { n: farmSummary.projectedYield })}
                    </span>
                  )}
                </div>
                {farmSummary.crops.length > 0 && (
                  <div className="civ-build-grid" style={{ marginTop: 8 }}>
                    {farmSummary.crops.map(([crop, count]) => (
                      <span key={crop} className="civ-chip">
                        {tn('civ.farms.crop', count, { crop: simLabel('good', crop) })}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="civ-section">
            <h3>{t('civ.goods.title')}</h3>
            {goodsTotalRows.length === 0 && <div className="civ-empty">{t('civ.goods.empty')}</div>}
            <div className="civ-build-grid">
              {goodsTotalRows.map(([kind, total]) => (
                <span key={kind} className="civ-chip" title={simLabel('good', kind)}>
                  {GOOD_EMOJI[kind] ?? '🧰'} {simLabel('good', kind)}: {fmtNumber(total)}
                </span>
              ))}
              {goodsOverflow > 0 && <span className="civ-chip">{t('civ.more', { n: goodsOverflow })}</span>}
            </div>
            {goodsTotalRows.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                {t('civ.goods.byLineage')}
                <div style={{ marginTop: 4 }}>
                  {[...goodsByLineage.entries()]
                    .sort((a, b) => {
                      const sa = [...a[1].values()].reduce((s, v) => s + v, 0)
                      const sb = [...b[1].values()].reduce((s, v) => s + v, 0)
                      return sb - sa
                    })
                    .slice(0, 6)
                    .map(([lid, bag]) => {
                      const lname = lineageById(lid)
                      const total = [...bag.values()].reduce((s, v) => s + v, 0)
                      const top = [...bag.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([k, n]) => `${GOOD_EMOJI[k] ?? ''}${n}`)
                        .join(' ')
                      return (
                        <div key={lid} className="civ-row" style={{ padding: '2px 0' }}>
                          <span className="civ-row-head">{lname}</span>
                          <span className="civ-row-tag">{t('civ.goods.held', { n: total })}</span>
                          <span className="civ-row-sub">{top}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </section>

          <section className="civ-section">
            <h3>{t('civ.books.title')}</h3>
            {books.length === 0 && <div className="civ-empty">{t('civ.books.empty')}</div>}
            {books.slice(0, 6).map((b) => (
              <div key={b.id} className="civ-row">
                <span className="civ-row-head">
                  {'\u{1F4D6}'} {b.title}
                </span>
                <span className="civ-row-sub">
                  {t('civ.books.byline', { author: b.author_name ?? '', topic: keyed(TOPIC_KEYS, b.topic) })}
                </span>
                <span className="civ-row-tag">{tn('civ.books.copies', b.copies ?? 0)}</span>
              </div>
            ))}
          </section>

          <section className="civ-section">
            <h3>{t('civ.art.title')}</h3>
            {artworks.length === 0 && <div className="civ-empty">{t('civ.art.empty')}</div>}
            {artworks.slice(0, 6).map((a) => (
              <div key={a.id} className="civ-row">
                <span className="civ-row-head">
                  {ART_EMOJI[a.kind] ?? ''} {a.title}
                </span>
                <span className="civ-row-sub">{t('civ.art.by', { name: a.creator_name })}</span>
              </div>
            ))}
          </section>

          <section className="civ-section">
            <h3>{t('civ.trade.title')}</h3>
            {tradeRoutes.length === 0 && caravans.length === 0 ? (
              <div className="civ-empty">{t('civ.trade.empty')}</div>
            ) : (
              <>
                <div className="civ-row">
                  <span className="civ-row-head">
                    {'\u{1F6E4}\u{FE0F}'} {tn('civ.trade.routes', tradeRoutes.length)}
                  </span>
                  <span className="civ-row-tag">{tn('civ.trade.caravans', caravans.length)}</span>
                  <span className="civ-row-sub">
                    {t('civ.trade.totals', {
                      deliveries: tradeRoutes.reduce((sum, route) => sum + route.deliveries, 0),
                      moved: tradeRoutes.reduce((sum, route) => sum + route.volume, 0),
                    })}
                  </span>
                </div>
                {[...tradeRoutes]
                  .sort(
                    (left, right) =>
                      right.deliveries - left.deliveries ||
                      right.last_dispatch_tick - left.last_dispatch_tick ||
                      left.id - right.id,
                  )
                  .slice(0, 8)
                  .map((route) => {
                    const routeCaravans = caravans.filter((caravan) => caravan.route_id === route.id)
                    const distance =
                      Math.abs(route.a_center[0] - route.b_center[0]) +
                      Math.abs(route.a_center[1] - route.b_center[1])
                    return (
                      <div key={route.id} className="civ-row">
                        <span className="civ-row-head">
                          {lineageById(route.lineage_a)} ↔ {lineageById(route.lineage_b)}
                        </span>
                        <span className="civ-row-sub">
                          {t('civ.trade.route', {
                            distance,
                            delivered: route.deliveries,
                            volume: route.volume,
                          })}
                        </span>
                        {routeCaravans.length > 0 && (
                          <span className="civ-row-tag">
                            {t('civ.trade.enRoute', { n: routeCaravans.length })}
                          </span>
                        )}
                      </div>
                    )
                  })}
                {[...caravans]
                  .sort((left, right) => left.arrives_tick - right.arrives_tick || left.id - right.id)
                  .slice(0, 8)
                  .map((caravan) => {
                    const duration = Math.max(1, caravan.arrives_tick - caravan.departed_tick)
                    const progress = Math.max(0, Math.min(1, (world.tick - caravan.departed_tick) / duration))
                    const eta = Math.max(0, caravan.arrives_tick - world.tick)
                    return (
                      <div key={caravan.id} className="civ-row">
                        <span className="civ-row-head">
                          {'\u{1F42A}'} {lineageById(caravan.sender_lineage)} →{' '}
                          {lineageById(caravan.receiver_lineage)}
                        </span>
                        <span className="civ-row-sub">
                          {GOOD_EMOJI[caravan.cargo] ?? '\u{1F4E6}'}{' '}
                          {t('civ.trade.cargo', {
                            amount: caravan.amount,
                            good: cargoLabel(caravan.cargo),
                          })}{' '}
                          · {Math.round(progress * 100)}%
                        </span>
                        <span className="civ-row-tag">
                          {eta === 0 ? t('civ.trade.unloading') : tn('civ.trade.ticksAway', eta)}
                        </span>
                      </div>
                    )
                  })}
              </>
            )}
          </section>

          <section className="civ-section">
            <h3>{t('civ.trades.title')}</h3>
            {(() => {
              const trades = world.trades ?? []
              if (trades.length === 0) {
                return <div className="civ-empty">{t('civ.trades.empty')}</div>
              }
              const nameById = new Map<string, string>()
              for (const o of world.organisms) nameById.set(o.id, o.name)
              return trades.slice(0, 6).map((trade, i) => {
                const buyer = nameById.get(trade.buyer_id) ?? trade.buyer_id.slice(0, 6)
                const seller = nameById.get(trade.seller_id) ?? trade.seller_id.slice(0, 6)
                return (
                  <div key={`${trade.tick}-${i}`} className="civ-row">
                    <span className="civ-row-head">
                      {'\u{1F4B0}'} {seller} → {buyer}
                    </span>
                    <span className="civ-row-sub">
                      {GOOD_EMOJI[trade.good] ?? ''}{' '}
                      {t('civ.trade.cargo', { amount: trade.amount, good: cargoLabel(trade.good) })}
                    </span>
                    <span className="civ-row-tag">{tn('civ.trades.coins', trade.price)}</span>
                    <span className="civ-row-tag">{t('civ.tick', { tick: trade.tick })}</span>
                  </div>
                )
              })
            })()}
          </section>

          <section className="civ-section">
            <h3>{t('civ.headlines.title')}</h3>
            {headlines.length === 0 && <div className="civ-empty">{t('civ.headlines.empty')}</div>}
            {headlines.slice(0, 12).map((h, i) => (
              <div key={`${h.tick}-${i}`} className="civ-headline">
                <span className="civ-headline-tick">{t('civ.tick', { tick: h.tick })}</span>
                <span className="civ-headline-text">{h.text}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </Modal>
  )
}
