import clsx from 'clsx'
import { useState } from 'react'
import { useUIStore } from '../../state/store'
import { popHistory } from '../../state/worldStore'
import { sparklinePoints, trend } from '../../game/model/pop-history'
import type { PrayerInfo, WorldState } from '../../shared/types'
import { lineageColor } from '../../shared/constants'
import { PRAYER_KINDS } from '../../game/model/prayers'
import { lossLine, PERIL_HELP, perilOf, remainingLine } from '../../game/model/tribe-peril'
import { activeBattles, enemiesOf } from '../../game/render/battles'
import { relationsLine, relationsOf } from '../../game/model/diplomacy'
import { leadershipOf } from '../../game/model/leadership'
import { festivalLabel } from '../../game/render/festivals'
import { tribeStatus } from '../../game/model/tribe-status'
import { wealthGapOf, wealthGapWord } from '../../game/model/inequality'
import { crimeLineOf } from '../../game/model/crime'
import { generationLine, generationsOf } from '../../game/model/generations'
import { familyLineText, familyLines } from '../../game/model/family-lines'
import { eldestByLineage, eldestLine } from '../../game/model/tribe-eldest'
import { ToolSprite } from '../toolbar/ToolSprite'
import { t, tn } from '../../i18n'
import { simLabel } from '../../i18n/sim'

interface Props {
  world: WorldState
  onAnswer: (prayer: PrayerInfo) => void
  /** Pick up a dock tool by id, looking at the tribe. */
  onTool: (toolId: string, at: { x: number; y: number }) => void
  /** Give the tribe a name of the player's choosing. */
  onRename: (lineage: string, name: string) => void
  /** Teach the tribe the next secret it lacks. */
  onTeach: (lineage: string) => void
}

function Need({ label, value }: { label: string; value: number }) {
  const low = value < 0.45
  return (
    <div className={clsx('tribe-need', low && 'low')}>
      <span>{label}</span>
      <span className="tribe-need-bar">
        <span style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
    </div>
  )
}

/** How a tribe's numbers have moved over the last few seasons. */
function Sparkline({ lineage }: { lineage: string }) {
  const samples = popHistory.get(lineage) ?? []
  if (samples.length < 3) return null
  const direction = trend(samples)
  return (
    <div
      className={clsx('tribe-spark', direction)}
      title={tn('panel.tribe.lately', samples[samples.length - 1]!, { from: samples[0]! })}
    >
      <svg width="72" height="14" viewBox="0 0 72 14" aria-hidden="true">
        <polyline points={sparklinePoints(samples, 72, 14)} fill="none" strokeWidth="1.5" />
      </svg>
      <span>
        {t(
          direction === 'up'
            ? 'panel.tribe.growing'
            : direction === 'down'
              ? 'panel.tribe.shrinking'
              : 'panel.tribe.steady',
        )}
      </span>
    </div>
  )
}

/**
 * The tribe's name, with its rename field. The draft lives here, keyed by tribe, so it is dropped when the
 * card moves to another tribe or hides (the card unmounts this with it).
 */
function TribeName({
  lineage,
  name,
  onRename,
}: {
  lineage: string
  name: string
  onRename: Props['onRename']
}) {
  const [editing, setEditing] = useState<string | null>(null)
  if (editing === null) {
    return (
      <button
        className="tribe-card-name tribe-card-rename"
        title={t('panel.tribe.renameTip')}
        onClick={() => setEditing(name)}
      >
        {name} <span aria-hidden="true">✎</span>
      </button>
    )
  }
  return (
    <input
      className="tribe-card-name-input"
      autoFocus
      maxLength={24}
      value={editing}
      aria-label={t('panel.tribe.nameAria')}
      onChange={(e) => setEditing(e.target.value)}
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          const next = editing.trim()
          if (next && next !== name) onRename(lineage, next)
          setEditing(null)
        } else if (e.key === 'Escape') setEditing(null)
      }}
    />
  )
}

/**
 * The focused tribe at a glance: what they need, how they feel about the
 * gods, and what they are praying for. Appears when a tribe is focused from
 * the tribe list or the territory map.
 */
export function TribeCard({ world, onAnswer, onTool, onRename, onTeach }: Props) {
  const focus = useUIStore((s) => s.focus)
  const setFocus = useUIStore((s) => s.setFocus)
  if (!focus.startsWith('lineage:')) return null
  const status = tribeStatus(world, focus.slice('lineage:'.length))
  if (!status) return null
  const gap = wealthGapOf(world.lineage_inequality, status.id)
  const gens = generationsOf(world.lineage_generations, status.id)
  const crime = crimeLineOf(world.lineage_crime, status.id)
  const prayer = status.prayer
  const enemies = enemiesOf(world.battles, status.id).map((l) => world.lineage_names?.[l] ?? l.slice(0, 6))
  const field = activeBattles(world.battles).find(
    (b) => b.attackers.includes(status.id) || b.defenders.includes(status.id),
  )
  const relations = relationsLine(relationsOf(world, status.id))
  const leadership = leadershipOf(world, status.id)
  const festival = festivalLabel(world.festivals, status.id)
  const peril = perilOf(world, status.id)
  const losses = lossLine(world.tribe_losses?.[status.id])
  const families = familyLines(world.organisms, status.id)
  const eldest = eldestByLineage(world.organisms)[status.id]
  const help = peril ? PERIL_HELP[peril.cause] : null
  const lookAtTribe = (tool: string) => {
    const home = world.settlements?.find((s) => s.lineage_id === status.id)
    if (home) onTool(tool, { x: home.center[0], y: home.center[1] })
  }

  return (
    <div className="tribe-card" role="region" aria-label={t('panel.tribe.aria', { name: status.name })}>
      <div className="tribe-card-head">
        <span className="lineage-dot" style={{ background: lineageColor(status.id) }} />
        <TribeName key={status.id} lineage={status.id} name={status.name} onRename={onRename} />
        <button className="tribe-card-close" aria-label={t('common.close')} onClick={() => setFocus('all')}>
          ×
        </button>
      </div>
      {leadership && (
        <div className="tribe-card-leader">
          {simLabel('government', leadership.government)}
          {leadership.leader && (
            <>
              {t('panel.tribe.ledBy')}
              <button
                className="tribe-leader-link"
                title={t('panel.tribe.followLeader')}
                onClick={() => {
                  const ui = useUIStore.getState()
                  ui.selectOrg(leadership.leader!.id)
                  ui.followOrg(leadership.leader!.id)
                }}
              >
                {leadership.leader.name}
              </button>
            </>
          )}
        </div>
      )}
      {festival && <div className="tribe-card-festival">{t('panel.tribe.festival', { festival })}</div>}
      <div className="tribe-card-sub">
        {tn('panel.tribe.people', status.people)}
        {status.era && ` · ${t('model.eraAge', { era: status.era })}`}
        {gap && ` · ${t('panel.tribe.wealth', { gap: wealthGapWord(gap) })}`}
        {gens && ` · ${generationLine(gens)}`}
        {crime && ` · ${crime}`}
      </div>
      {peril && help && (
        <div className="tribe-peril" role="alert">
          <span>
            {t('panel.tribe.brink', {
              remaining: remainingLine(peril.population),
              peak: peril.peak,
              reason: help.reason,
            })}
          </span>
          <button className="tribe-peril-help" onClick={() => lookAtTribe(help.tool)}>
            {help.action}
          </button>
        </div>
      )}
      {enemies.length > 0 && field && (
        <div className="tribe-peril tribe-war" role="status">
          <span>{t('panel.tribe.atWar', { names: enemies.join(', ') })}</span>
          <button
            className="tribe-peril-help"
            onClick={() => onTool('peace', { x: field.location[0], y: field.location[1] })}
          >
            {t('peril.action.peace')}
          </button>
        </div>
      )}
      <Sparkline lineage={status.id} />
      <Need label={t('panel.tribe.food')} value={status.food} />
      {status.stores > 0 && <p className="tribe-stores">{tn('panel.tribe.granary', status.stores)}</p>}
      {status.bread > 0 && <p className="tribe-stores">{tn('panel.tribe.bakery', status.bread)}</p>}
      {status.livestock > 0 && <p className="tribe-stores">{tn('panel.tribe.pen', status.livestock)}</p>}
      <Need label={t('panel.tribe.water')} value={status.water} />
      <Need label={t('panel.tribe.health')} value={status.health} />
      {losses && <div className="tribe-card-losses">{t('panel.tribe.losses', { losses })}</div>}
      {relations && <div className="tribe-card-relations">{relations}</div>}
      {eldest && (
        <div className="tribe-card-relations" title={t('panel.tribe.eldestTip')}>
          {t('panel.tribe.eldest', { line: eldestLine(eldest) })}
        </div>
      )}
      {families.length > 0 && (
        <div className="tribe-card-relations" title={t('panel.tribe.familiesTip')}>
          {t('panel.tribe.families', { list: families.map(familyLineText).join(' · ') })}
        </div>
      )}
      <div className="tribe-card-row">
        <span
          className={clsx('tribe-faith', status.blessed && 'blessed', status.despairing && 'despair')}
          title={status.lostFaith ? t('panel.tribe.lostFaithTip') : t('panel.tribe.faithTip')}
        >
          {t('panel.tribe.faith', { n: status.faith })}
          {status.blessed
            ? t('panel.tribe.blessed')
            : status.lostFaith
              ? t('panel.tribe.lostFaith')
              : status.despairing
                ? t('panel.tribe.despairing')
                : ''}
        </span>
        {status.sick > 0 && <span className="tribe-sick">{tn('panel.tribe.sick', status.sick)}</span>}
      </div>
      {status.nextAge && (
        <div className="tribe-next">
          <div className="tribe-next-head">
            <span>{t('panel.tribe.next', { era: t('model.eraAge', { era: status.nextAge.era }) })}</span>
            <span className="tribe-next-actions">
              <button
                className="tribe-inspire"
                title={t('panel.tribe.inspireTip')}
                onClick={() => lookAtTribe('inspire')}
              >
                {t('panel.tribe.inspire')}
              </button>
              {status.nextAge.missing.length > 0 && (
                <button
                  className="tribe-inspire"
                  title={t('panel.tribe.teachTip')}
                  onClick={() => onTeach(status.id)}
                >
                  {t('panel.tribe.teach')}
                </button>
              )}
            </span>
          </div>
          <span className="tribe-need-bar">
            <span
              style={{
                width: `${Math.round((status.nextAge.known / Math.max(1, status.nextAge.required)) * 100)}%`,
              }}
            />
          </span>
          {status.nextAge.missing.length > 0 && (
            <div className="tribe-next-missing">
              {t('panel.tribe.toLearn', { list: status.nextAge.missing.slice(0, 3).join(', ') })}
            </div>
          )}
          {status.nextAge.peopleNeeded > 0 && (
            <div className="tribe-next-missing">
              {tn('panel.tribe.needsPeople', status.nextAge.peopleNeeded)}
            </div>
          )}
        </div>
      )}
      {prayer && (
        <button className="tribe-card-prayer" onClick={() => onAnswer(prayer)}>
          <ToolSprite icon={PRAYER_KINDS[prayer.kind]?.icon ?? '🙏'} size={16} />
          <span>{PRAYER_KINDS[prayer.kind]?.plea ?? t('panel.tribe.praying')}</span>
          <span className="tribe-card-help">{t('panel.tribe.help')}</span>
        </button>
      )}
    </div>
  )
}
