import { defineMessages } from '../define'

/**
 * The readouts around the map: the header chips (calendar, peril, prayers, people, weather), the
 * calendar words, the left panel's footer, the headline ticker, the first-prayer hint and the
 * card shown when the world falls silent.
 */
export const hud = defineMessages(
  {
    'calendar.season.abundance': 'Summer',
    'calendar.season.decline': 'Autumn',
    'calendar.season.scarcity': 'Winter',
    'calendar.season.recovery': 'Spring',
    'calendar.yearSeason': 'Year {year}, {season}',
    'calendar.ageDecimal': '{years} yrs',
    'calendar.ageYears': { one: '{n} yrs', other: '{n} yrs' },
  },
  {
    // A verb after a count agrees with it ("21 племя молит", "3 племени молят"), which a plea passed
    // in cannot do; this generic form keeps the count out of the subject.
    'calendar.season.abundance': 'лето',
    'calendar.season.decline': 'осень',
    'calendar.season.scarcity': 'зима',
    'calendar.season.recovery': 'весна',
    'calendar.yearSeason': 'Год {year}, {season}',
    'calendar.ageDecimal': '{years} года',
    'calendar.ageYears': {
      one: '{n} год',
      few: '{n} года',
      many: '{n} лет',
      other: '{n} года',
    },
  },
)
