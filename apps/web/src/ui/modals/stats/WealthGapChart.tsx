import { useMemo } from 'react'
import { wealthGapYears } from '../../../game/model/wealth-history'
import { fmtNumber, t, type MessageKey } from '../../../i18n'

// The even / uneven / stark words wealthGapYears gives each year.
const WORD_KEYS: Record<string, MessageKey> = {
  even: 'stats.gap.word.even',
  uneven: 'stats.gap.word.uneven',
  stark: 'stats.gap.word.stark',
}

const W = 1000
const H = 200
const PAD = { t: 12, r: 12, b: 28, l: 40 }

/** The average tribe wealth gap (0 even, 1 one person holds all) for each year. */
export function WealthGapChart({ values }: { values: number[] }) {
  const years = useMemo(() => wealthGapYears(values), [values])
  if (years.length === 0) {
    return (
      <div style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
        {t('stats.firstYear')}
      </div>
    )
  }
  const cw = W - PAD.l - PAD.r
  const ch = H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (years.length === 1 ? cw / 2 : (i / (years.length - 1)) * cw)
  const y = (g: number) => PAD.t + ch - Math.min(1, Math.max(0, g)) * ch
  const line = years.map((p, i) => `${x(i).toFixed(1)},${y(p.gini).toFixed(1)}`).join(' ')
  const stark = y(0.5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t('stats.gap.aria')}>
      <line x1={PAD.l} x2={W - PAD.r} y1={stark} y2={stark} stroke="#555" strokeDasharray="4 4" />
      <text x={W - PAD.r} y={stark - 4} fill="#777" fontSize="11" textAnchor="end">
        {t('stats.gap.stark')}
      </text>
      <text x={PAD.l - 6} y={PAD.t + 10} fill="#777" fontSize="11" textAnchor="end">
        1
      </text>
      <text x={PAD.l - 6} y={H - PAD.b} fill="#777" fontSize="11" textAnchor="end">
        0
      </text>
      <polyline points={line} fill="none" stroke="#e8c46a" strokeWidth="2" />
      {years.map((p, i) => (
        <g key={p.year}>
          <circle cx={x(i)} cy={y(p.gini)} r="3.5" fill="#e8c46a">
            <title>
              {t('stats.gap.point', {
                year: p.year,
                word: WORD_KEYS[p.word] ? t(WORD_KEYS[p.word]) : p.word,
                gini: fmtNumber(p.gini, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              })}
            </title>
          </circle>
          <text x={x(i)} y={H - 8} fill="#777" fontSize="11" textAnchor="middle">
            {p.year}
          </text>
        </g>
      ))}
    </svg>
  )
}
