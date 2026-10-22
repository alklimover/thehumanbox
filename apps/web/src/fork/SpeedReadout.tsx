// Fork: the value on the time control's speed button. While the world keeps
// up it is the requested speed as before; when it falls notably behind it says
// what it really runs at, "6× из 40×", and a small "эко" marks a simulation the
// desktop has moved to the efficiency cores (actual-speed.ts).
import { formatSpeed } from '../simulation/speedSteps'
import { t } from '../i18n'
import { formatActualSpeed, type SimPowerState } from './actual-speed'

interface Props {
  speed: number
  /** The achieved speed when it lags the requested one, else null. */
  lagging: number | null
  power: SimPowerState | null
}

export function SpeedReadout({ speed, lagging, power }: Props) {
  const eco = power?.managed === true && power.mode === 'efficiency'
  return (
    <>
      {lagging === null ? (
        formatSpeed(speed)
      ) : (
        <span className="fork-speed-of">
          {t('speed.of', { actual: formatActualSpeed(lagging), asked: formatSpeed(speed) })}
        </span>
      )}
      {eco && (
        <span className="fork-speed-eco" aria-hidden="true">
          {t('speed.eco')}
        </span>
      )}
    </>
  )
}
