// The world's calendar, derived from the tick count. Mirrors
// crates/sim-core/src/sim/calendar.rs and cosmos.rs (DAY_LENGTH, SEASON_LENGTH
// and the four-season year); keep the two in step.

import { fmtNumber, t, tn, type MessageKey } from '../../i18n'

export const DAY_TICKS = 600
export const SEASON_TICKS = 3000
export const YEAR_TICKS = 4 * SEASON_TICKS

/** Simulation season names in the order a year runs through them. */
const SEASON_ORDER = ['abundance', 'decline', 'scarcity', 'recovery'] as const

export type CalendarSeason = (typeof SEASON_ORDER)[number]

const SEASON_NAMES: Record<CalendarSeason, MessageKey> = {
  abundance: 'calendar.season.abundance',
  decline: 'calendar.season.decline',
  scarcity: 'calendar.season.scarcity',
  recovery: 'calendar.season.recovery',
}

export interface CalendarDate {
  /** Year, counted from 1. */
  year: number
  /** Name people use for the season: Spring, Summer, Autumn or Winter. */
  season: string
  /** Day within the season, counted from 1 (a season is five days). */
  dayOfSeason: number
}

/** The simulation's key for the season a tick falls in ('abundance' is summer). */
export function calendarSeasonAt(tick: number): CalendarSeason {
  const ticks = Math.max(0, Math.floor(tick))
  return SEASON_ORDER[Math.floor((ticks % YEAR_TICKS) / SEASON_TICKS) % SEASON_ORDER.length]
}

export function calendarAt(tick: number): CalendarDate {
  const ticks = Math.max(0, Math.floor(tick))
  return {
    year: Math.floor(ticks / YEAR_TICKS) + 1,
    season: t(SEASON_NAMES[calendarSeasonAt(ticks)]),
    dayOfSeason: Math.floor((ticks % SEASON_TICKS) / DAY_TICKS) + 1,
  }
}

/** An age in ticks, as years: one decimal while young ("1.4 yrs"), whole years after. */
export function ageInYears(ageTicks: number): string {
  const years = ageTicks / YEAR_TICKS
  if (years >= 10) return tn('calendar.ageYears', Math.floor(years))
  const decimal = fmtNumber(years, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return t('calendar.ageDecimal', { years: decimal })
}

const MOON_PHASES: Record<string, MessageKey> = {
  new_moon: 'moon.new_moon',
  waxing_crescent: 'moon.waxing_crescent',
  first_quarter: 'moon.first_quarter',
  waxing_gibbous: 'moon.waxing_gibbous',
  full_moon: 'moon.full_moon',
  waning_gibbous: 'moon.waning_gibbous',
  last_quarter: 'moon.last_quarter',
  waning_crescent: 'moon.waning_crescent',
}

/** The moon's phase in words ("waxing crescent") for the simulation's id ("waxing_crescent"). */
export function moonPhaseName(phase: string): string {
  const key = MOON_PHASES[phase]
  return key ? t(key) : phase.replace(/_/g, ' ')
}
