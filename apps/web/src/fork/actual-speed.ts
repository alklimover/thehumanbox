// Fork: the speed the world really runs at, beside the one asked for. Past
// what this computer can step, "40×" can really be 3×. The desktop's native
// sim measures it (apps/server/src/fork_speed.rs, `actual_speed` in
// GET /runtime); the browser build keeps the time control's own estimate from
// the frames. The desktop shell also says when it has moved the sim to the
// efficiency cores (apps/desktop/main/fork-power.ts).
import { useEffect, useState } from 'react'
import { fmtNumber, t, type MessageKey } from '../i18n'
import { API_BASE } from '../shared/config'
import { getDesktop, isDesktop } from '../shared/desktop'

export type SimPowerReason = 'thermal' | 'low-power' | 'battery' | 'hidden'

export interface SimPowerState {
  /** False outside macOS, or while no simulation runs. */
  managed: boolean
  mode: 'performance' | 'efficiency'
  reason: SimPowerReason | null
}

const POLL_MS = 2_000
const REASONS: readonly SimPowerReason[] = ['thermal', 'low-power', 'battery', 'hidden']

/** Below this share of the requested speed the difference is worth showing. */
const LAG_SHARE = 0.8
/** Slower requests are left alone: a world at 1× is not asked to hurry. */
const LAG_FROM = 2

export interface RuntimeSpeed {
  speed: number
  actual: number
}

/** The requested and achieved speed from a GET /runtime body, or null without a reading. */
export function parseRuntimeSpeed(body: unknown): RuntimeSpeed | null {
  if (typeof body !== 'object' || body === null) return null
  const { speed, actual_speed: actual } = body as { speed?: unknown; actual_speed?: unknown }
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed <= 0) return null
  if (typeof actual !== 'number' || !Number.isFinite(actual) || actual < 0) return null
  return { speed, actual }
}

/** True when the world runs notably slower than asked. */
export function speedLags(asked: number, actual: number | null): actual is number {
  return actual !== null && asked >= LAG_FROM && actual < asked * LAG_SHARE
}

/** An achieved speed, as precise as it is worth: `0,4×`, `2,5×`, `17×`. */
export function formatActualSpeed(actual: number): string {
  const digits = actual < 1 ? 2 : actual < 10 ? 1 : 0
  return `${fmtNumber(actual, { maximumFractionDigits: digits })}×`
}

export function parsePowerState(raw: unknown): SimPowerState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { managed, mode, reason } = raw as Record<string, unknown>
  if (typeof managed !== 'boolean' || (mode !== 'performance' && mode !== 'efficiency')) return null
  return {
    managed,
    mode,
    reason: REASONS.includes(reason as SimPowerReason) ? (reason as SimPowerReason) : null,
  }
}

/** The sentence on why the sim is on the efficiency cores, or undefined when it is not. */
export function powerNote(power: SimPowerState | null): string | undefined {
  if (!power?.managed || power.mode !== 'efficiency' || !power.reason) return undefined
  return t(`speed.power.${power.reason}` as MessageKey)
}

/** The time control's tooltip line with the power note after it. */
export function withPowerNote(note: string | undefined, power: SimPowerState | null): string | undefined {
  const extra = powerNote(power)
  return note && extra ? `${note} ${extra}` : (note ?? extra)
}

/**
 * The achieved speed. On the desktop it is the native sim's own measurement, polled while time runs
 * and the page is visible, and only for the speed asked now; elsewhere it is `fallback`.
 */
export function useActualSpeed(paused: boolean, asked: number, fallback: number | null): number | null {
  const desktop = isDesktop()
  const [reading, setReading] = useState<RuntimeSpeed | null>(null)

  useEffect(() => {
    if (!desktop || paused) return
    let live = true
    const poll = () => {
      if (document.visibilityState === 'hidden') return
      fetch(`${API_BASE}/runtime`, { signal: AbortSignal.timeout(POLL_MS) })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: unknown) => {
          if (live) setReading(parseRuntimeSpeed(body))
        })
        .catch(() => undefined)
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [desktop, paused, asked])

  if (!desktop) return fallback
  // A reading taken before the speed changed says nothing about the new one.
  if (paused || !reading || Math.abs(reading.speed - asked) > asked * 0.01) return null
  return reading.actual
}

/** Which cores the desktop runs the simulation on; null outside the desktop app. */
export function useSimPower(): SimPowerState | null {
  const [power, setPower] = useState<SimPowerState | null>(null)
  useEffect(() => {
    const api = getDesktop()?.forkPower
    if (!api) return
    let live = true
    api
      .state()
      .then((state) => live && setPower(parsePowerState(state)))
      .catch(() => undefined)
    const off = api.onChange((state) => setPower(parsePowerState(state)))
    return () => {
      live = false
      off()
    }
  }, [])
  return power
}
