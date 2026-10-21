import { calendarAt, calendarSeasonAt, type CalendarSeason } from '../../game/model/calendar'
import { vegetationSeason } from '../../game/render/landscape-style'
import { t, type MessageKey } from '../../i18n'
import type { WorldState } from '../../shared/types'

/** The part of the day the light is in. The thresholds are the sky's (render/cf/overlays/atmosphere.ts). */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

export const DAY_PHASE_ICON: Record<DayPhase, string> = {
  dawn: '🌅',
  day: '☀️',
  dusk: '🌇',
  night: '🌙',
}

export const DAY_PHASE_TITLE: Record<DayPhase, string> = {
  dawn: t('calendar.phaseTitle.dawn'),
  day: t('calendar.phaseTitle.day'),
  dusk: t('calendar.phaseTitle.dusk'),
  night: t('calendar.phaseTitle.night'),
}

/** The part of the day as the tag shows it: "night". */
export const DAY_PHASE_WORD: Record<DayPhase, string> = {
  dawn: t('calendar.phase.dawn'),
  day: t('calendar.phase.day'),
  dusk: t('calendar.phase.dusk'),
  night: t('calendar.phase.night'),
}

/** The season inside a phrase: "Day 3 of 5 in summer" (Russian needs the genitive, "3-й день лета"). */
export const SEASON_IN: Record<CalendarSeason, string> = {
  abundance: t('calendar.seasonIn.abundance'),
  decline: t('calendar.seasonIn.decline'),
  scarcity: t('calendar.seasonIn.scarcity'),
  recovery: t('calendar.seasonIn.recovery'),
}

const SEASON_WORDS: Record<string, MessageKey> = {
  spring: 'calendar.word.spring',
  summer: 'calendar.word.summer',
  autumn: 'calendar.word.autumn',
  winter: 'calendar.word.winter',
}

/** The season of the land ("summer"), in words, for the simulation's season key. */
function seasonWord(season: string): string {
  const word = vegetationSeason(season)
  const key = SEASON_WORDS[word]
  return key ? t(key) : word
}

type DayWorld = Pick<WorldState, 'is_day' | 'day_progress'>

export function dayPhase(world: DayWorld): DayPhase {
  if (!world.is_day) return 'night'
  const progress = world.day_progress ?? 0.5
  if (progress < 0.12) return 'dawn'
  if (progress > 0.55) return 'dusk'
  return 'day'
}

// The simulation names seasons by what they do to food; the header shows
// the calendar name (autumn used to read as "decline", as if the world
// were dying) and explains the effect in the tooltip.
const SEASON_TIPS: Record<string, MessageKey> = {
  recovery: 'calendar.tip.recovery',
  abundance: 'calendar.tip.abundance',
  decline: 'calendar.tip.decline',
  scarcity: 'calendar.tip.scarcity',
}

type TagWorld = Pick<
  WorldState,
  'tick' | 'season' | 'is_day' | 'day_progress' | 'hard_winter' | 'hard_winter_ahead'
>

export interface CalendarTagParts {
  /** Year, counted from 1. */
  year: number
  /** Calendar season name for the tooltip title: "Summer". */
  calendarSeason: string
  /** The calendar season inside a phrase, for the tooltip: "summer" ("лета" in Russian). */
  calendarSeasonIn: string
  /** Day within the season, counted from 1. */
  dayOfSeason: number
  /** The season as the tag shows it: "summer", or "hard winter" in a hard winter. */
  seasonWord: string
  /** The simulation's season key, which picks the season's colour (`season-abundance`, ...). */
  seasonClass: string
  hardWinter: boolean
  /** A hard winter is coming, not here yet: the tag shows a snowflake. */
  hardWinterAhead: boolean
  phase: DayPhase
  /** Percent through the day, for the tooltip. */
  dayPercent: number
}

/** Everything the one time tag says, derived from the world's tick and the season and light fields. */
export function calendarTagParts(world: TagWorld): CalendarTagParts {
  const date = calendarAt(world.tick)
  const hardWinter = !!world.hard_winter
  return {
    year: date.year,
    calendarSeason: date.season,
    calendarSeasonIn: SEASON_IN[calendarSeasonAt(world.tick)],
    dayOfSeason: date.dayOfSeason,
    seasonWord: hardWinter ? t('calendar.word.hardWinter') : seasonWord(world.season),
    seasonClass: world.season,
    hardWinter,
    hardWinterAhead: !hardWinter && !!world.hard_winter_ahead,
    phase: dayPhase(world),
    dayPercent: Math.round((world.day_progress ?? 0) * 100),
  }
}

/** The season's effect, in words, for the tooltip. Hard winters and their warnings say what to do about them. */
export function seasonNote(world: TagWorld): { title?: string; body: string; how?: string } {
  if (world.hard_winter) {
    return {
      title: t('calendar.word.hardWinter'),
      body: t('calendar.hardWinter.body'),
      how: t('calendar.hardWinter.how'),
    }
  }
  if (world.hard_winter_ahead) {
    return {
      title: t('calendar.ahead.title', { season: seasonWord(world.season) }),
      body: t('calendar.ahead.body'),
      how: t('calendar.ahead.how'),
    }
  }
  const tip = SEASON_TIPS[world.season]
  return { body: t(tip ?? 'calendar.tip.other') }
}
