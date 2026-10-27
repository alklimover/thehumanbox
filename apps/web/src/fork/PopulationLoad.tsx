// Fork: the world-capacity slider, coloured by the load each size puts on this
// computer (green, yellow, red, like a game's graphics-quality setting), with
// the estimate for the chosen size under it. The model is population-load.ts;
// the machine is measured by the desktop shell (main/fork-device.ts).
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { ft, ftn, fmtNumber, type ForkMessageKey } from './i18n'
import type { DesktopBridge } from '../shared/desktop'
import {
  type DeviceProfile,
  LOAD_COLORS,
  estimateLoad,
  lightUpTo,
  loadGradient,
  loadThresholds,
} from './population-load'

const GB = 1024 ** 3

/** The device profile, measured on first use; null while measuring or outside the desktop app. */
function useDeviceProfile(desktop: DesktopBridge | null) {
  const [profile, setProfile] = useState<DeviceProfile | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const load = useCallback(
    (remeasure: boolean) => {
      const api = desktop?.forkDevice
      if (!api) return () => {}
      let live = true
      setMeasuring(true)
      api
        .profile(remeasure)
        .then((p) => live && setProfile(p))
        .catch(() => live && setProfile(null))
        .finally(() => live && setMeasuring(false))
      return () => {
        live = false
      }
    },
    [desktop],
  )

  useEffect(() => load(false), [load])
  return { profile, measuring, remeasure: () => load(true) }
}

export interface PopulationLoadSliderProps {
  desktop: DesktopBridge | null
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  /** The desktop's tick interval: one tick every this many ms at 1x. */
  tickMs: number
  /** While a save or restart is in flight the cap cannot change (as upstream's slider). */
  disabled?: boolean
}

export function PopulationLoadSlider({
  desktop,
  value,
  onChange,
  min,
  max,
  step,
  tickMs,
  disabled,
}: PopulationLoadSliderProps) {
  const { profile, measuring, remeasure } = useDeviceProfile(desktop)
  const known = profile !== null || !desktop?.forkDevice
  const thresholds = loadThresholds(min, max, step, tickMs, profile)
  const estimate = estimateLoad(value, tickMs, profile)
  const optimal = lightUpTo(thresholds, min, max, step)

  const rangeStyle = {
    width: '100%',
    '--fork-load-track': known ? loadGradient(min, max, thresholds) : '#443329',
    '--fork-load-thumb': known ? LOAD_COLORS[estimate.level] : '#927047',
  } as CSSProperties

  const levelKey = `load.level.${estimate.level}` as ForkMessageKey
  const speed =
    estimate.comfortableSpeed >= 1
      ? ft('load.speed', { speed: fmtNumber(estimate.comfortableSpeed, { maximumFractionDigits: 1 }) })
      : ft('load.speedNone')

  return (
    <div className="fork-load">
      <input
        type="range"
        className="fork-load-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={rangeStyle}
      />
      {known ? (
        <div className="fork-load-estimate">
          <span className="fork-load-level" style={{ color: LOAD_COLORS[estimate.level] }}>
            {ft(levelKey)}
          </span>
          {' · '}
          {ft('load.facts', {
            gb: fmtNumber(estimate.memoryMb / 1024, { maximumFractionDigits: 1 }),
            cpu: fmtNumber(Math.round(estimate.cpuShare * 100)),
          })}
          {' · '}
          {speed}
        </div>
      ) : (
        <div className="settings-note">{ft('load.measuring')}</div>
      )}
      {profile && (
        <div className="settings-note fork-load-device">
          {ft('load.device', {
            chip: profile.chip,
            gb: fmtNumber(Math.round(profile.totalMemBytes / GB)),
          })}
          {' · '}
          {optimal === null
            ? ft('load.optimalNone')
            : ftn('load.optimal', optimal, { n: fmtNumber(optimal) })}
          {profile.benchMsPerTick === null && <> · {ft('load.unmeasured')}</>}{' '}
          <button type="button" className="fork-load-remeasure" onClick={remeasure} disabled={measuring}>
            {measuring ? ft('load.measuring') : ft('load.remeasure')}
          </button>
        </div>
      )}
      <div className="settings-note">{ft('load.hint')}</div>
    </div>
  )
}
