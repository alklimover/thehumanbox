import { t } from '../../i18n'
import type { WorldState } from '../../shared/types'

export interface WeatherCondition {
  key: 'rain' | 'storm' | 'drought'
  icon: string
  title: string
  body: string
}

/** Every weather condition the world has right now, in the order the header shows them. */
export function weatherConditions(world: Pick<WorldState, 'weather' | 'drought'>): WeatherCondition[] {
  const out: WeatherCondition[] = []
  if (world.weather?.kind === 'rain') {
    out.push({ key: 'rain', icon: '🌧️', title: t('weather.rain'), body: t('weather.rain.body') })
  }
  if (world.weather?.kind === 'storm') {
    out.push({ key: 'storm', icon: '⛈️', title: t('weather.storm'), body: t('weather.storm.body') })
  }
  if (world.drought) {
    out.push({
      key: 'drought',
      icon: '🏜️',
      title: t('weather.drought'),
      body: t('weather.drought.body'),
    })
  }
  return out
}
