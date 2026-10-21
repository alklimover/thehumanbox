import { useMemo } from 'react'
import { t, type MessageKey } from '../../i18n'
import { simLabel } from '../../i18n/sim'
import type { WorldState } from '../../shared/types'

const WEATHER_WORD: Record<string, MessageKey> = {
  clear: 'weather.kind.clear',
  rain: 'weather.kind.rain',
  storm: 'weather.kind.storm',
  snow: 'weather.kind.snow',
  fog: 'weather.kind.fog',
  wet: 'weather.kind.wet',
}

interface Props {
  world: WorldState
}

export function WorldFooter({ world }: Props) {
  const moodCounts = useMemo(() => {
    let ally = 0,
      rivals = 0,
      neutral = 0
    for (const r of world.tribal_relations ?? []) {
      if (r.status === 'ally') ally++
      else if (r.status === 'rivals') rivals++
      else neutral++
    }
    return { ally, rivals, neutral }
  }, [world.tribal_relations])

  const era = world.current_era ? simLabel('era', world.current_era).toUpperCase() : '-'
  const dayPct = Math.round((world.day_progress ?? 0) * 100)
  const phase = world.is_day ? t('footer.day') : t('footer.night')
  const weatherKind = world.weather?.kind ?? 'clear'
  const weatherWord = WEATHER_WORD[weatherKind] ? t(WEATHER_WORD[weatherKind]) : weatherKind
  const droughtTag = world.drought ? t('footer.drought') : ''

  return (
    <div className="world-footer">
      <div className="footer-row">
        <span className="footer-label">{t('footer.era')}</span>
        <span className="footer-value era-tag">{era}</span>
      </div>
      <div className="footer-row">
        <span className="footer-label">{phase}</span>
        <div className="footer-bar">
          <div className="footer-bar-fill" style={{ width: `${dayPct}%` }} />
        </div>
      </div>
      <div className="footer-row">
        <span className="footer-label">{t('footer.weather')}</span>
        <span className="footer-value">
          {weatherWord}
          {droughtTag}
        </span>
      </div>
      <div className="footer-row">
        <span className="footer-label">{t('footer.tribes')}</span>
        <span className="footer-value mood">
          <span className="mood-ally">{moodCounts.ally}♥</span>
          <span className="mood-neutral">{moodCounts.neutral}·</span>
          <span className="mood-rivals">{moodCounts.rivals}⚔</span>
        </span>
      </div>
    </div>
  )
}
