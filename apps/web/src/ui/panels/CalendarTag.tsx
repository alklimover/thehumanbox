import clsx from 'clsx'
import type { WorldState } from '../../shared/types'
import { moonPhaseName } from '../../game/model/calendar'
import { t } from '../../i18n'
import { Tooltip } from '../toolbar/Tooltip'
import { ToolSprite } from '../toolbar/ToolSprite'
import { calendarTagParts, DAY_PHASE_ICON, DAY_PHASE_TITLE, DAY_PHASE_WORD, seasonNote } from './calendar-tag'

/**
 * The one readout for the calendar and the light, in the header: "Y15 · SUMMER · night".
 * The season's colour is a dot, not a chip of its own. The tooltip keeps the full
 * date, the day in the season, what the season does and how far through the day it is.
 */
export function CalendarTag({ world }: { world: WorldState }) {
  const parts = calendarTagParts(world)
  const note = seasonNote(world)
  const tip = (
    <span className="tip-card">
      <span className="tip-title">
        {t('calendar.yearSeason', { year: parts.year, season: parts.calendarSeason })}
      </span>
      <span className="tip-body">
        {t('calendar.dayOfSeason', { day: parts.dayOfSeason, season: parts.calendarSeasonIn })}
      </span>
      {note.title && <span className="tip-title">{note.title}</span>}
      <span className="tip-body">{note.body}</span>
      {note.how && <span className="tip-how">{note.how}</span>}
      <span className="tip-how">
        {t('calendar.dayThrough', { phase: DAY_PHASE_TITLE[parts.phase], percent: parts.dayPercent })}
      </span>
      {world.cosmos && (
        <>
          <span className="tip-title">
            {t('header.moon', { phase: moonPhaseName(world.cosmos.moon_phase) })}
          </span>
          <span className="tip-how">
            {t('calendar.yearDay', { year: world.cosmos.year + 1, day: world.cosmos.day_of_year + 1 })}
          </span>
        </>
      )}
    </span>
  )
  return (
    <Tooltip tip={tip}>
      <span
        className={clsx(
          'hdr-chip',
          'time-tag',
          `season-${parts.seasonClass}`,
          parts.hardWinter && 'hard-winter',
          `phase-${parts.phase}`,
        )}
        style={{ cursor: 'default' }}
      >
        <span className="time-tag-year">{t('calendar.yearTag', { year: parts.year })}</span>
        <span className="time-tag-sep" aria-hidden="true">
          ·
        </span>
        <span className="time-tag-season">
          <span className="time-tag-dot" aria-hidden="true" />
          {parts.seasonWord}
          {parts.hardWinterAhead && (
            <span className="time-tag-omen" role="img" aria-label={t('calendar.hardWinterAhead')}>
              ❄
            </span>
          )}
        </span>
        <span className="time-tag-sep" aria-hidden="true">
          ·
        </span>
        <span className="time-tag-phase">
          <ToolSprite icon={DAY_PHASE_ICON[parts.phase]} size={14} />
          {DAY_PHASE_WORD[parts.phase]}
        </span>
      </span>
    </Tooltip>
  )
}
