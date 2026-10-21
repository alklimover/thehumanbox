import type { WorldState } from '../../shared/types'
import { useFrozenSnapshot } from '../../shared/hooks/useFrozenSnapshot'
import { Modal } from './Modal'
import { DAY_LENGTH, kindIcon } from './stats/constants'
import { PopChart } from './stats/PopChart'
import { YearlyChart } from './stats/YearlyChart'
import { WealthGapChart } from './stats/WealthGapChart'
import { LegendsList } from './stats/LegendsList'
import { RelationsTable } from './stats/RelationsTable'
import { DiscoveryTimeline } from './stats/DiscoveryTimeline'
import { AgePyramid } from './stats/AgePyramid'
import { GenerationBars } from './stats/GenerationBars'
import { OldestList } from './stats/OldestList'
import { longevityOf, type Longevity } from '../../game/model/longevity'
import { ageInYears } from '../../game/model/calendar'
import { fmtNumber, t, tn } from '../../i18n'
import { simLabel } from '../../i18n/sim'
import { TraitAverages } from './stats/TraitAverages'
import { DiscoveryRollup } from './stats/DiscoveryRollup'
import { BondStats } from './stats/BondStats'
import { NotableOrgs } from './stats/NotableOrgs'

interface Props {
  world: WorldState
  onClose: () => void
}

/** "longest life 78 yrs (Ara, Sabami)" and "average 61 yrs over 14 old-age deaths". */
function longevityLines(longevity: Longevity, lineageName: (lineage: string) => string): string[] {
  const { longest, averageAge, deaths } = longevity
  if (deaths === 0 || !longest || averageAge === null) return []
  return [
    t('stats.longest', {
      age: ageInYears(longest.age),
      name: longest.name,
      tribe: lineageName(longest.lineage_id),
    }),
    tn('stats.average', deaths, { age: ageInYears(averageAge) }),
  ]
}

export function StatsModal({ world: liveWorld, onClose }: Props) {
  const { frozen: world, reload } = useFrozenSnapshot(() => liveWorld)
  const liveCount = world.organisms.filter((o) => o.alive).length
  const totalDeaths =
    (world.history.deaths_old_age ?? 0) +
    (world.history.deaths_starvation ?? 0) +
    (world.history.deaths_dehydration ?? 0) +
    (world.history.deaths_sickness ?? 0) +
    (world.history.deaths_combat ?? 0)
  const fireCount = world.organisms.filter((o) => o.alive && (o.discoveries ?? []).includes('fire')).length
  const shelterCount = world.organisms.filter(
    (o) => o.alive && (o.discoveries ?? []).includes('shelter'),
  ).length
  const currentDay = Math.floor(world.tick / DAY_LENGTH)

  const animalCount = world.animals.length
  const animalKinds = world.animals.reduce<Record<string, number>>((acc, a) => {
    acc[a.kind] = (acc[a.kind] ?? 0) + 1
    return acc
  }, {})

  return (
    <Modal open onClose={onClose} className="stats-modal" title={t('stats.title')} hideTitle>
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('stats.heading')}</span>
        <span className="tree-modal-sub">
          {world.cosmos
            ? t('stats.subYear', {
                year: world.cosmos.year + 1,
                day: world.cosmos.day_of_year + 1,
                alive: liveCount,
              })
            : t('stats.subDay', { day: currentDay, alive: liveCount })}
        </span>
        <div className="modal-header-actions">
          <button className="reload-btn" onClick={reload} title={t('modals.reload')}>
            ⟳
          </button>
          <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="stats-body">
        <div className="stats-quick">
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(liveCount)}</div>
            <div className="stats-num-label">{t('stats.alive')}</div>
          </div>
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(totalDeaths)}</div>
            <div className="stats-num-label">{t('stats.totalDeaths')}</div>
          </div>
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(world.history.births)}</div>
            <div className="stats-num-label">{t('stats.totalBirths')}</div>
          </div>
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(currentDay)}</div>
            <div className="stats-num-label">{t('stats.daysElapsed')}</div>
          </div>
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(fireCount)}</div>
            <div className="stats-num-label">🔥 {t('stats.knowFire')}</div>
          </div>
          <div className="stats-num-card">
            <div className="stats-num">{fmtNumber(shelterCount)}</div>
            <div className="stats-num-label">🏠 {t('stats.haveShelter')}</div>
          </div>
          <div
            className="stats-num-card stats-num-card-wide"
            title={Object.entries(animalKinds)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => `${kindIcon(k)} ${simLabel('animal', k)}: ${fmtNumber(n)}`)
              .join('\n')}
          >
            <div className="stats-num">{fmtNumber(animalCount)}</div>
            <div className="stats-num-label">🦌 {t('stats.animals')}</div>
            <div className="stats-num-sub">
              {Object.entries(animalKinds)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([k, n]) => `${kindIcon(k)} ${fmtNumber(n)}`)
                .join('  ')}
              {Object.keys(animalKinds).length > 3 && '  …'}
            </div>
          </div>
        </div>

        <div className="stats-section-title">{t('stats.section.population')}</div>
        <div className="stats-chart-wrap">
          <PopChart history={world.pop_history ?? []} />
        </div>

        <div className="stats-section-title">{t('stats.section.yearly')}</div>
        <div className="stats-chart-wrap">
          <YearlyChart
            births={world.history.births_by_year ?? []}
            deaths={world.history.deaths_by_year ?? []}
          />
        </div>

        <div className="stats-section-title">{t('stats.section.wealthGap')}</div>
        <div className="stats-chart-wrap">
          <WealthGapChart values={world.history.wealth_gap_by_year ?? []} />
        </div>

        <div className="stats-grid">
          <section>
            <div className="stats-section-title">{t('stats.section.agePyramid')}</div>
            <AgePyramid organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.traits')}</div>
            <TraitAverages organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.relations')}</div>
            <RelationsTable
              relations={world.tribal_relations ?? []}
              lineageSizes={world.lineage_sizes ?? []}
              lineageNames={world.lineage_names}
            />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.discoveries')}</div>
            <DiscoveryRollup organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.legends')}</div>
            <LegendsList events={world.events ?? []} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.generations')}</div>
            <GenerationBars organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.oldest')}</div>
            <OldestList
              organisms={world.organisms.filter((o) => o.alive)}
              lineageNames={world.lineage_names}
            />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.longevity')}</div>
            {longevityLines(
              longevityOf(world.organisms),
              (l) => world.lineage_names?.[l] ?? l.slice(0, 6),
            ).map((line) => (
              <div key={line} style={{ fontSize: 11, lineHeight: 1.6 }}>
                {line}
              </div>
            ))}
            {longevityOf(world.organisms).deaths === 0 && (
              <div style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: '4px 0' }}>
                {t('stats.noOldAge')}
              </div>
            )}
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.deaths')}</div>
            <div className="stats-death-grid">
              <span className="hist-label">{simLabel('deathCause', 'starvation')}</span>{' '}
              <span className="hist-val">{world.history.deaths_starvation}</span>
              <span className="hist-label">{simLabel('deathCause', 'dehydration')}</span>{' '}
              <span className="hist-val">{world.history.deaths_dehydration}</span>
              <span className="hist-label">{simLabel('deathCause', 'sickness')}</span>{' '}
              <span className="hist-val">{world.history.deaths_sickness}</span>
              <span className="hist-label">{simLabel('deathCause', 'combat')}</span>{' '}
              <span className="hist-val">{world.history.deaths_combat}</span>
              <span className="hist-label">{simLabel('deathCause', 'old age')}</span>{' '}
              <span className="hist-val">{world.history.deaths_old_age}</span>
              <span className="hist-label">{t('stats.droughts')}</span>{' '}
              <span className="hist-val">{world.history.droughts}</span>
              <span className="hist-label">{t('stats.outbreaks')}</span>{' '}
              <span className="hist-val">{world.history.outbreaks}</span>
            </div>
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.bonds')}</div>
            <BondStats organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.notable')}</div>
            <NotableOrgs organisms={world.organisms.filter((o) => o.alive)} />
          </section>

          <section>
            <div className="stats-section-title">{t('stats.section.discoveryLog')}</div>
            <DiscoveryTimeline events={world.events ?? []} />
          </section>

          {world.history.era_history && world.history.era_history.length > 0 && (
            <section>
              <div className="stats-section-title">{t('stats.section.eras')}</div>
              <div className="stats-timeline">
                {[...world.history.era_history]
                  .reverse()
                  .slice(0, 12)
                  .map((e, i) => (
                    <div key={i} className="stats-timeline-row">
                      <span className="stats-tick">
                        {t('stats.day', { n: Math.floor(e.tick / DAY_LENGTH) })}
                      </span>
                      <span className={`era-badge era-${e.era}`} style={{ fontSize: 9 }}>
                        {simLabel('era', e.era)}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Modal>
  )
}
