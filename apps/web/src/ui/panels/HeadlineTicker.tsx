import { useMemo } from 'react'
import { t } from '../../i18n'
import type { WorldState } from '../../shared/types'
import { simText } from '../../i18n/simtext'

interface Props {
  world: WorldState | null
  enabled?: boolean
}

export function HeadlineTicker({ world, enabled = true }: Props) {
  const lines = useMemo<string[]>(() => {
    if (!world?.headlines || world.headlines.length === 0) return []
    const newest = world.headlines.slice(0, 12)
    return newest.map((h) => simText('headline', h.text ?? '')).filter(Boolean)
  }, [world?.headlines])

  if (!enabled || lines.length === 0) return null

  const repeated = [...lines, ...lines]

  return (
    <div className="headline-ticker" role="marquee" aria-label={t('ticker.aria')}>
      <div className="headline-ticker-track">
        {repeated.map((line, i) => (
          <span key={i} className="headline-ticker-item">
            <span className="headline-ticker-glyph">✦</span>
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}
