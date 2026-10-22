// Fork: which cores the simulation runs on, decided by itself. A big world at
// high speed keeps one core flat out; on a performance core that heats the Mac
// and spins its fans. On macOS the simulation-rs child is demoted to the
// background band (PRIO_DARWIN_BG: efficiency cores, throttled disk I/O) when
// the Mac runs on battery or in Low Power Mode, is hot, or nobody is looking
// at the window, and returned to the performance cores otherwise.
//
// `taskpolicy -b/-B -p <pid>` is the stock front end to
// setpriority(PRIO_DARWIN_PROCESS, pid, PRIO_DARWIN_BG); Node's
// os.setPriority only reaches nice values, which do not move a process off
// the performance cores, and a QoS clamp (`taskpolicy -c`) can only be set at
// launch. Elsewhere this is a no-op.
import { app, BrowserWindow, IpcMain, powerMonitor } from "electron";
import { execFile, execFileSync } from "node:child_process";
import { activeSim } from "./sim-process";

export type PowerMode = "performance" | "efficiency";
/** Why the simulation is on the efficiency cores, most telling first. */
export type PowerReason = "thermal" | "low-power" | "battery" | "hidden";
export type ThermalState = "unknown" | "nominal" | "fair" | "serious" | "critical";

export interface PowerInputs {
  onBattery: boolean;
  lowPowerMode: boolean;
  thermalState: ThermalState;
  windowVisible: boolean;
}

export interface PowerDecision {
  mode: PowerMode;
  reason: PowerReason | null;
}

/** What the renderer is told: the mode only means something while a simulation runs here. */
export interface PowerState extends PowerDecision {
  managed: boolean;
}

const TASKPOLICY = "/usr/sbin/taskpolicy";
const PMSET = "/usr/bin/pmset";
/** How often a new simulation (a restart gives a new pid) and the window are checked. */
const CHECK_EVERY_MS = 2_000;
/** Low Power Mode has no Electron event; pmset is asked this often. */
const LOW_POWER_EVERY_MS = 30_000;

export function decidePowerMode(inputs: PowerInputs): PowerDecision {
  if (inputs.thermalState === "serious" || inputs.thermalState === "critical") {
    return { mode: "efficiency", reason: "thermal" };
  }
  if (inputs.lowPowerMode) return { mode: "efficiency", reason: "low-power" };
  if (inputs.onBattery) return { mode: "efficiency", reason: "battery" };
  if (!inputs.windowVisible) return { mode: "efficiency", reason: "hidden" };
  return { mode: "performance", reason: null };
}

/**
 * Low Power Mode from `pmset -g`: `lowpowermode 1` on older macOS, `powermode 1`
 * (0 automatic, 1 low power, 2 high power) where the Mac has energy modes.
 */
export function parseLowPowerMode(pmsetOutput: string): boolean {
  return /^\s*(?:lowpowermode|powermode)\s+1\b/m.test(pmsetOutput);
}

export function taskpolicyArgs(mode: PowerMode, pid: number): string[] {
  return [mode === "efficiency" ? "-b" : "-B", "-p", String(pid)];
}

function thermalState(): ThermalState {
  try {
    return powerMonitor.getCurrentThermalState();
  } catch {
    return "unknown";
  }
}

function anyWindowVisible(): boolean {
  return BrowserWindow.getAllWindows().some(
    (win) => !win.isDestroyed() && win.isVisible() && !win.isMinimized(),
  );
}

let lowPowerMode = false;
// A fresh simulation starts on the performance cores.
let applied: { pid: number; mode: PowerMode } | null = null;
// The simulation being stopped by a quit or a closed window: its final save
// runs at full speed, and it is no longer demoted.
let releasedPid: number | null = null;
let published: PowerState = { managed: false, mode: "performance", reason: null };

function currentState(): PowerState {
  const pid = activeSim()?.child.pid;
  if (pid === undefined) releasedPid = null;
  if (process.platform !== "darwin" || pid === undefined || pid === releasedPid) {
    return { managed: false, mode: "performance", reason: null };
  }
  const decision = decidePowerMode({
    onBattery: powerMonitor.isOnBatteryPower(),
    lowPowerMode,
    thermalState: thermalState(),
    windowVisible: anyWindowVisible(),
  });
  return { managed: true, ...decision };
}

function setMode(pid: number, mode: PowerMode): void {
  applied = { pid, mode };
  execFile(TASKPOLICY, taskpolicyArgs(mode, pid), { timeout: 5_000 }, (error) => {
    // Tried again on the next change of state, not every check.
    if (error) console.warn(`[power] taskpolicy ${mode} pid=${pid} failed: ${error.message}`);
  });
}

function evaluate(): void {
  const state = currentState();
  const pid = activeSim()?.child.pid;
  if (state.managed && pid !== undefined) {
    if (applied?.pid !== pid) applied = { pid, mode: "performance" };
    if (applied.mode !== state.mode) setMode(pid, state.mode);
  }
  if (
    state.managed !== published.managed ||
    state.mode !== published.mode ||
    state.reason !== published.reason
  ) {
    published = state;
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send("fork:power:changed", state);
    }
  }
}

function refreshLowPowerMode(): void {
  execFile(PMSET, ["-g"], { timeout: 5_000 }, (error, stdout) => {
    if (error) return;
    const next = parseLowPowerMode(String(stdout));
    if (next === lowPowerMode) return;
    lowPowerMode = next;
    evaluate();
  });
}

/** Before a quit or a closed window stops the simulation, give it its cores back. */
function release(): void {
  const pid = activeSim()?.child.pid;
  if (pid === undefined) return;
  releasedPid = pid;
  if (applied?.pid === pid && applied.mode === "efficiency") {
    applied = { pid, mode: "performance" };
    try {
      execFileSync(TASKPOLICY, taskpolicyArgs("performance", pid), { timeout: 2_000 });
    } catch (error) {
      console.warn(`[power] taskpolicy restore pid=${pid} failed: ${(error as Error).message}`);
    }
  }
  evaluate();
}

export function registerForkPower(ipc: IpcMain): void {
  ipc.handle("fork:power:state", () => {
    evaluate();
    return published;
  });
  if (process.platform !== "darwin") return;

  const onPowerChange = (): void => {
    refreshLowPowerMode();
    evaluate();
  };
  powerMonitor.on("on-ac", onPowerChange);
  powerMonitor.on("on-battery", onPowerChange);
  powerMonitor.on("thermal-state-change", onPowerChange);
  app.on("browser-window-created", (_event, win) => {
    win.on("show", evaluate);
    win.on("hide", evaluate);
    win.on("minimize", evaluate);
    win.on("restore", evaluate);
  });
  app.on("before-quit", release);
  app.on("window-all-closed", release);

  refreshLowPowerMode();
  setInterval(evaluate, CHECK_EVERY_MS).unref();
  setInterval(refreshLowPowerMode, LOW_POWER_EVERY_MS).unref();
}
