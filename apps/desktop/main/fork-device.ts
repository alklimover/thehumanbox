// Fork: what this computer is, for the world-capacity slider's load colours
// (apps/web/src/fork/population-load.ts). The CPU and memory come from the OS;
// how fast the machine steps a world comes from `simulation-rs --bench-cpu`
// (apps/server/src/fork_bench.rs), run once per app version and kept in the
// user data folder, since the engine's cost changes between versions.
import { app, IpcMain } from "electron";
import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { locateSimBinary } from "./sim-process";

export interface DeviceProfile {
  chip: string;
  totalMemBytes: number;
  perfCores: number | null;
  efficiencyCores: number | null;
  benchMsPerTick: number | null;
}

interface CachedBench {
  appVersion: string;
  benchMsPerTick: number;
  measuredAt: number;
}

const CACHE_FILE = "fork-device-bench.json";
/** Runs per measurement; the fastest counts, so a busy moment is not taken for a slow machine. */
const BENCH_RUNS = 2;
const BENCH_TIMEOUT_MS = 60_000;

/** The ms per tick in `--bench-cpu` output (its last JSON line), or null. */
export function parseBenchOutput(stdout: string): number | null {
  const lines = stdout.trim().split("\n").reverse();
  for (const line of lines) {
    try {
      const value = (JSON.parse(line) as { bench?: unknown; ms_per_tick?: unknown })
        .ms_per_tick;
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
      }
    } catch {
      // Not the result line.
    }
  }
  return null;
}

/** A cached bench result, when it was measured by this version of the app. */
export function cachedBench(raw: unknown, appVersion: string): number | null {
  if (!raw || typeof raw !== "object") return null;
  const cached = raw as Partial<CachedBench>;
  return cached.appVersion === appVersion &&
    typeof cached.benchMsPerTick === "number" &&
    Number.isFinite(cached.benchMsPerTick) &&
    cached.benchMsPerTick > 0
    ? cached.benchMsPerTick
    : null;
}

function readCache(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function runBenchOnce(bin: string): Promise<number | null> {
  return new Promise((resolve) => {
    execFile(
      bin,
      ["--bench-cpu"],
      { timeout: BENCH_TIMEOUT_MS, windowsHide: true },
      (error, stdout) => resolve(error ? null : parseBenchOutput(String(stdout))),
    );
  });
}

async function measureBench(): Promise<number | null> {
  const bin = locateSimBinary();
  if (!bin) return null;
  let best: number | null = null;
  for (let run = 0; run < BENCH_RUNS; run++) {
    const result = await runBenchOnce(bin);
    if (result !== null && (best === null || result < best)) best = result;
  }
  return best;
}

function sysctlNumber(name: string): Promise<number | null> {
  if (process.platform !== "darwin") return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile("/usr/sbin/sysctl", ["-n", name], { timeout: 5000 }, (error, stdout) => {
      const value = Number.parseInt(String(stdout).trim(), 10);
      resolve(error || !Number.isFinite(value) ? null : value);
    });
  });
}

let pending: Promise<DeviceProfile> | null = null;

async function loadProfile(remeasure: boolean): Promise<DeviceProfile> {
  const cacheFile = path.join(app.getPath("userData"), CACHE_FILE);
  const appVersion = app.getVersion();
  let bench = remeasure ? null : cachedBench(readCache(cacheFile), appVersion);
  if (bench === null) {
    bench = await measureBench();
    if (bench !== null) {
      const record: CachedBench = { appVersion, benchMsPerTick: bench, measuredAt: Date.now() };
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(record));
      } catch {
        // Measured again next time.
      }
    }
  }
  const [perfCores, efficiencyCores] = await Promise.all([
    sysctlNumber("hw.perflevel0.physicalcpu"),
    sysctlNumber("hw.perflevel1.physicalcpu"),
  ]);
  return {
    chip: os.cpus()[0]?.model?.trim() || os.arch(),
    totalMemBytes: os.totalmem(),
    perfCores,
    efficiencyCores,
    benchMsPerTick: bench,
  };
}

/** The profile, measuring the machine on first use; one measurement at a time. */
export function deviceProfile(remeasure = false): Promise<DeviceProfile> {
  if (!pending || remeasure) {
    const next = loadProfile(remeasure);
    pending = next;
    // A failed load is not kept, so the next request tries again.
    next.catch(() => {
      if (pending === next) pending = null;
    });
  }
  return pending;
}

export function registerForkDevice(ipc: IpcMain): void {
  ipc.handle("fork:device:profile", (_e, remeasure: unknown) =>
    deviceProfile(remeasure === true),
  );
}
