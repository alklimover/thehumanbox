// Fork: how heavy a world of a given capacity is for this computer, so the
// capacity slider can be coloured like a game's graphics-quality setting.
//
// The machine is measured once by `simulation-rs --bench-cpu`
// (apps/server/src/fork_bench.rs, run by apps/desktop/main/fork-device.ts); the
// costs below were measured on the reference machine and are scaled by the
// ratio of the two bench results. Re-measure them whenever a change makes a
// tick cheaper or dearer (docs/fork/PERF-PLAN.ru.md).

/** What the desktop shell knows about this computer. */
export interface DeviceProfile {
  /** CPU brand, e.g. "Apple M1". */
  chip: string
  totalMemBytes: number
  perfCores: number | null
  efficiencyCores: number | null
  /** `--bench-cpu` result, ms per tick; null when it could not run. */
  benchMsPerTick: number | null
}

/** `--bench-cpu` on the reference machine (Apple M5 Pro): median of five runs. */
export const REFERENCE_BENCH_MS = 1.04

/**
 * Ratio to the reference when the bench could not run: about an Apple M1, the
 * slowest machine the macOS build targets, so the slider errs on the safe side.
 */
const UNKNOWN_MACHINE_FACTOR = 1.8

/**
 * Milliseconds per tick of a mature world on one core of the reference
 * machine, by people alive. Measured headless after the trade-check fix
 * (#23): seeds 7 and 42 up to ~3,000 people, and a real 2,974-person world
 * grown to 3,543 and 4,285; 5,000 is extrapolated from the last two.
 */
const TICK_CURVE: ReadonlyArray<readonly [number, number]> = [
  [120, 4],
  [350, 11],
  [1000, 20],
  [2000, 43],
  [3000, 70],
  [3500, 88],
  [4250, 112],
  [5000, 145],
]
/** Growth past the last point: tick cost ~ people^1.4. */
const TICK_EXPONENT_PAST_CURVE = 1.4

/**
 * Memory of the whole app in MB at a given capacity: the simulation process
 * (its peak, which includes the copy a checkpoint takes) plus the window
 * (renderer and Electron helpers). Fitted to a 1,913-person world (sim
 * 609 MB, renderer 725 MB, helpers ~250 MB) and a 2,923-person heap census
 * (82 KB per living person).
 */
const SIM_BASE_MB = 240
const SIM_PER_PERSON_MB = 0.165
const WINDOW_BASE_MB = 700
const WINDOW_PER_PERSON_MB = 0.14

/** Share of one core at 1x: up to this is light, up to the next moderate. */
const CPU_LIGHT = 0.35
const CPU_MODERATE = 0.75
/** Share of the computer's memory: the same. */
const MEM_LIGHT = 0.2
const MEM_MODERATE = 0.35

export type LoadLevel = 'light' | 'moderate' | 'heavy'

export interface LoadEstimate {
  level: LoadLevel
  /** Share of one core the simulation needs at 1x (1 = the whole core). */
  cpuShare: number
  /** Fastest speed multiplier that stays within a moderate load (0 when even 1x does not). */
  comfortableSpeed: number
  memoryMb: number
  memoryShare: number
}

const LEVELS: readonly LoadLevel[] = ['light', 'moderate', 'heavy']

function levelOf(value: number, light: number, moderate: number): LoadLevel {
  return value <= light ? 'light' : value <= moderate ? 'moderate' : 'heavy'
}

function worse(a: LoadLevel, b: LoadLevel): LoadLevel {
  return LEVELS[Math.max(LEVELS.indexOf(a), LEVELS.indexOf(b))]
}

/** Reference-machine ms per tick for a world of `people`. */
export function referenceTickMs(people: number): number {
  const n = Math.max(people, TICK_CURVE[0][0])
  for (let i = 1; i < TICK_CURVE.length; i++) {
    const [n1, ms1] = TICK_CURVE[i]
    if (n <= n1) {
      const [n0, ms0] = TICK_CURVE[i - 1]
      return ms0 + ((ms1 - ms0) * (n - n0)) / (n1 - n0)
    }
  }
  const [nLast, msLast] = TICK_CURVE[TICK_CURVE.length - 1]
  return msLast * Math.pow(n / nLast, TICK_EXPONENT_PAST_CURVE)
}

/** How many times slower than the reference machine this one steps a world. */
export function machineFactor(profile: DeviceProfile | null): number {
  const bench = profile?.benchMsPerTick
  return bench && Number.isFinite(bench) && bench > 0 ? bench / REFERENCE_BENCH_MS : UNKNOWN_MACHINE_FACTOR
}

export function appMemoryMb(people: number): number {
  return SIM_BASE_MB + WINDOW_BASE_MB + (SIM_PER_PERSON_MB + WINDOW_PER_PERSON_MB) * people
}

/**
 * The load of a world of `people` on this computer at 1x, where one tick
 * comes every `tickMs` (the desktop setting, 100 ms by default).
 */
export function estimateLoad(people: number, tickMs: number, profile: DeviceProfile | null): LoadEstimate {
  const tickCost = referenceTickMs(people) * machineFactor(profile)
  const cpuShare = tickCost / Math.max(tickMs, 1)
  const memoryMb = appMemoryMb(people)
  const totalMb = profile && profile.totalMemBytes > 0 ? profile.totalMemBytes / 1_048_576 : 8192
  const memoryShare = memoryMb / totalMb
  return {
    level: worse(levelOf(cpuShare, CPU_LIGHT, CPU_MODERATE), levelOf(memoryShare, MEM_LIGHT, MEM_MODERATE)),
    cpuShare,
    comfortableSpeed: cpuShare > 0 ? CPU_MODERATE / cpuShare : 0,
    memoryMb,
    memoryShare,
  }
}

/** Where along the slider the load becomes moderate and heavy (null when it never does). */
export interface LoadThresholds {
  moderateFrom: number | null
  heavyFrom: number | null
}

export function loadThresholds(
  min: number,
  max: number,
  step: number,
  tickMs: number,
  profile: DeviceProfile | null,
): LoadThresholds {
  let moderateFrom: number | null = null
  let heavyFrom: number | null = null
  for (let n = min; n <= max; n += step) {
    const level = estimateLoad(n, tickMs, profile).level
    if (moderateFrom === null && level !== 'light') moderateFrom = n
    if (level === 'heavy') {
      heavyFrom = n
      break
    }
  }
  return { moderateFrom, heavyFrom }
}

/** The largest capacity that stays light, rounded down to the slider's step (null if none). */
export function lightUpTo(thresholds: LoadThresholds, min: number, max: number, step: number): number | null {
  const firstNotLight = thresholds.moderateFrom ?? thresholds.heavyFrom
  if (firstNotLight === null) return max
  const last = firstNotLight - step
  return last >= min ? last : null
}

export const LOAD_COLORS: Record<LoadLevel, string> = {
  light: '#6fae5b',
  moderate: '#d7a73c',
  heavy: '#c4553f',
}

/** A track background: green, then yellow, then red, with short blends at the borders. */
export function loadGradient(min: number, max: number, thresholds: LoadThresholds): string {
  const at = (n: number) => Math.min(100, Math.max(0, ((n - min) / (max - min)) * 100))
  const blend = 1.5
  const stops: string[] = [`${LOAD_COLORS.light} 0%`]
  const moderate = thresholds.moderateFrom
  const heavy = thresholds.heavyFrom
  if (moderate !== null && (heavy === null || moderate < heavy)) {
    const p = at(moderate)
    stops.push(`${LOAD_COLORS.light} ${Math.max(0, p - blend)}%`, `${LOAD_COLORS.moderate} ${p}%`)
  }
  if (heavy !== null) {
    const p = at(heavy)
    const before = moderate !== null && moderate < heavy ? LOAD_COLORS.moderate : LOAD_COLORS.light
    stops.push(`${before} ${Math.max(0, p - blend)}%`, `${LOAD_COLORS.heavy} ${p}%`)
  }
  const last =
    heavy !== null ? LOAD_COLORS.heavy : moderate !== null ? LOAD_COLORS.moderate : LOAD_COLORS.light
  stops.push(`${last} 100%`)
  return `linear-gradient(to right, ${stops.join(', ')})`
}
