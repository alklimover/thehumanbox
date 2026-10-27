import { describe, expect, it } from 'vitest'
import {
  type DeviceProfile,
  REFERENCE_BENCH_MS,
  appMemoryMb,
  estimateLoad,
  lightUpTo,
  loadGradient,
  loadThresholds,
  machineFactor,
  referenceTickMs,
} from './population-load'

const GB = 1024 ** 3

const reference: DeviceProfile = {
  chip: 'Apple M5 Pro',
  totalMemBytes: 64 * GB,
  perfCores: 6,
  efficiencyCores: 12,
  benchMsPerTick: REFERENCE_BENCH_MS,
}
const slowLaptop: DeviceProfile = {
  chip: 'Apple M1',
  totalMemBytes: 8 * GB,
  perfCores: 4,
  efficiencyCores: 4,
  benchMsPerTick: REFERENCE_BENCH_MS * 1.8,
}

describe('referenceTickMs', () => {
  it('follows the measured points and keeps rising past them', () => {
    expect(referenceTickMs(940)).toBe(14.7)
    expect(referenceTickMs(4050)).toBe(77)
    expect(referenceTickMs(1420)).toBeCloseTo(24.15)
    expect(referenceTickMs(6000)).toBeGreaterThan(referenceTickMs(5000))
    expect(referenceTickMs(10)).toBe(referenceTickMs(120))
  })

  it('never gets cheaper with more people', () => {
    for (let n = 120; n < 8000; n += 20) {
      expect(referenceTickMs(n + 20)).toBeGreaterThanOrEqual(referenceTickMs(n))
    }
  })
})

describe('machineFactor', () => {
  it('is the bench ratio, or a cautious guess without one', () => {
    expect(machineFactor(reference)).toBe(1)
    expect(machineFactor(slowLaptop)).toBeCloseTo(1.8)
    expect(machineFactor({ ...reference, benchMsPerTick: null })).toBeCloseTo(1.8)
    expect(machineFactor(null)).toBeCloseTo(1.8)
    expect(machineFactor({ ...reference, benchMsPerTick: Number.NaN })).toBeCloseTo(1.8)
  })
})

describe('estimateLoad', () => {
  it('rates a small world light everywhere', () => {
    expect(estimateLoad(350, 100, reference).level).toBe('light')
    expect(estimateLoad(350, 100, slowLaptop).level).toBe('light')
  })

  it('rates 5,000 people heavy at 1x even on the reference machine today', () => {
    const load = estimateLoad(5000, 100, reference)
    expect(load.cpuShare).toBeCloseTo(1.08)
    expect(load.level).toBe('heavy')
    expect(load.comfortableSpeed).toBeLessThan(1)
  })

  it('scales the CPU share with the machine and the tick interval', () => {
    const fast = estimateLoad(2000, 100, reference)
    expect(estimateLoad(2000, 100, slowLaptop).cpuShare).toBeCloseTo(fast.cpuShare * 1.8)
    expect(estimateLoad(2000, 200, reference).cpuShare).toBeCloseTo(fast.cpuShare / 2)
    expect(fast.comfortableSpeed).toBeCloseTo(0.75 / fast.cpuShare)
  })

  it('lets memory decide on a small machine', () => {
    const tiny: DeviceProfile = { ...reference, totalMemBytes: 4 * GB }
    // 3,000 people: ~1.9 GB of a 4 GB machine is heavy, though the CPU is fine with it.
    expect(appMemoryMb(3000)).toBeCloseTo(1855)
    expect(estimateLoad(3000, 1000, tiny).level).toBe('heavy')
    expect(estimateLoad(3000, 1000, reference).level).toBe('light')
  })
})

describe('loadThresholds and lightUpTo', () => {
  it('find the borders along the slider', () => {
    const t = loadThresholds(120, 5000, 20, 100, reference)
    expect(t.moderateFrom).not.toBeNull()
    expect(t.heavyFrom).not.toBeNull()
    expect(t.moderateFrom!).toBeLessThan(t.heavyFrom!)
    expect(estimateLoad(t.moderateFrom!, 100, reference).level).toBe('moderate')
    expect(estimateLoad(t.moderateFrom! - 20, 100, reference).level).toBe('light')
    expect(estimateLoad(t.heavyFrom!, 100, reference).level).toBe('heavy')
    expect(lightUpTo(t, 120, 5000, 20)).toBe(t.moderateFrom! - 20)
  })

  it('put the borders earlier on a slower machine', () => {
    const fast = loadThresholds(120, 5000, 20, 100, reference)
    const slow = loadThresholds(120, 5000, 20, 100, slowLaptop)
    expect(slow.moderateFrom!).toBeLessThan(fast.moderateFrom!)
    expect(slow.heavyFrom!).toBeLessThan(fast.heavyFrom!)
  })

  it('report no border when the whole range is light', () => {
    const t = loadThresholds(120, 300, 20, 2000, reference)
    expect(t).toEqual({ moderateFrom: null, heavyFrom: null })
    expect(lightUpTo(t, 120, 300, 20)).toBe(300)
  })
})

describe('loadGradient', () => {
  it('runs green, yellow, red at the borders', () => {
    const g = loadGradient(100, 1100, { moderateFrom: 600, heavyFrom: 900 })
    expect(g).toBe(
      'linear-gradient(to right, #6fae5b 0%, #6fae5b 48.5%, #d7a73c 50%, #d7a73c 78.5%, #c4553f 80%, #c4553f 100%)',
    )
  })

  it('stays green without borders and goes straight to red without a yellow band', () => {
    expect(loadGradient(100, 1100, { moderateFrom: null, heavyFrom: null })).toBe(
      'linear-gradient(to right, #6fae5b 0%, #6fae5b 100%)',
    )
    expect(loadGradient(100, 1100, { moderateFrom: 600, heavyFrom: 600 })).toBe(
      'linear-gradient(to right, #6fae5b 0%, #6fae5b 48.5%, #c4553f 50%, #c4553f 100%)',
    )
  })
})
