// Fork: the player's worlds as save slots. The simulation keeps every world in
// its own folder, worlds/<hash>/world.save, and plays the one named by the
// worlds/_live marker; starting a new world never deleted the old one, it only
// moved the marker. This lists those folders and lets the player open one, name
// it, move one to the Trash, or start a new world with a chosen seed and
// population limit, all while the previous world stays on disk.
//
// Opening a world swaps the marker the way other world operations here replace
// a file (`_live.next-*` / `_live.rollback-*`): if the app dies before the new
// world is verified, the next startup puts the previous marker back. A new
// world parks the marker as `_live.reset-*`, exactly like the upstream reset,
// so the same crash recovery restores it.
//
// fork-world.json also keeps how the player plays the world (`role`, the
// fork's observer and god modes, docs/fork/MODES.ru.md); the renderer reads it
// from the list and asks for it when a world has none.
import { BrowserWindow, IpcMain, shell } from "electron";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  effectiveDataRoot,
  loadSettings,
  saveSettings,
  Settings,
  worldsRoot,
} from "./settings";
import {
  activeSim,
  checkpointActiveSim,
  startSim,
  startSimWithDataRootLock,
  stopSim,
} from "./sim-process";
import { acquireDataRootLock, type DataRootLock } from "./data-lock";
import { loadRenderer } from "./renderer-load";
import { runExclusiveDesktopOperation } from "./exclusive-operation";
import { setPendingWorldSeed } from "./fork-world-seed";
import {
  atomicWriteNewFile,
  resolveActiveWorldFiles,
  restoreParkedLiveWorld,
  syncDirectoryBestEffort,
  validateWorldHash,
  validateWorldSaveBytesInWorker,
} from "./world-safety";

/** How the player plays a world: watching it, or answering it as its god. */
export type WorldRole = "observer" | "god";

/** What the fork remembers about a world, beside its save: worlds/<hash>/fork-world.json. */
interface WorldMeta {
  name?: string;
  seed?: string;
  createdAt?: number;
  role?: WorldRole;
}

export interface WorldSlot {
  hash: string;
  name: string | null;
  seed: string | null;
  createdAt: number | null;
  savedAt: number;
  sizeBytes: number;
  live: boolean;
  role: WorldRole | null;
}

const META_FILE = "fork-world.json";
const MAX_NAME = 60;

// ---------------------------------------------------------------- the seed

/**
 * A seed as the simulation takes it (a non-zero u64). A number is used as it
 * is; any other text ("лето", "Pangaea") is hashed, so a word can be shared as
 * a seed too. Empty means a random seed.
 */
export function seedFromText(text: string | null | undefined): string | null {
  const s = (text ?? "").trim();
  if (!s) return null;
  if (/^\d{1,20}$/.test(s) && BigInt(s) > 0n && BigInt(s) < 1n << 64n)
    return BigInt(s).toString();
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, "utf8")) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & ((1n << 64n) - 1n);
  }
  return (h === 0n ? 1n : h).toString();
}

// ---------------------------------------------------------------- the list

/** A role as stored or sent, or null for anything else. */
export function worldRole(value: unknown): WorldRole | null {
  return value === "observer" || value === "god" ? value : null;
}

function readMeta(dir: string): WorldMeta {
  try {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(dir, META_FILE), "utf8"),
    ) as WorldMeta;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMeta(dir: string, meta: WorldMeta): void {
  atomicWriteNewFile(path.join(dir, META_FILE), JSON.stringify(meta, null, 2), {
    overwrite: true,
  });
}

/** The worlds in a save folder, the playing one first, then the most recently saved. */
export function listWorlds(worldsDir: string): WorldSlot[] {
  let live: string | null = null;
  try {
    live = fs.readFileSync(path.join(worldsDir, "_live"), "utf8").trim();
  } catch {
    /* no live world yet */
  }
  let names: string[];
  try {
    names = fs.readdirSync(worldsDir);
  } catch {
    return [];
  }
  const out: WorldSlot[] = [];
  for (const hash of names) {
    // Quarantined and parked entries start with "." or "_".
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(hash)) continue;
    const dir = path.join(worldsDir, hash);
    let stat: fs.Stats;
    try {
      const dirStat = fs.lstatSync(dir);
      if (!dirStat.isDirectory()) continue;
      try {
        stat = fs.lstatSync(path.join(dir, "world.save"));
      } catch (error) {
        // A world just created has no save until its first autosave; it is
        // still the one being played.
        if (hash !== live) throw error;
        stat = dirStat;
      }
      if (!stat.isFile() && hash !== live) continue;
      if (stat.isFile() && stat.size === 0 && hash !== live) continue;
    } catch {
      continue;
    }
    const meta = readMeta(dir);
    out.push({
      hash,
      name:
        typeof meta.name === "string" && meta.name.trim()
          ? meta.name.trim()
          : null,
      seed: typeof meta.seed === "string" ? meta.seed : null,
      createdAt: typeof meta.createdAt === "number" ? meta.createdAt : null,
      savedAt: stat.mtimeMs,
      sizeBytes: stat.isFile() ? stat.size : 0,
      live: hash === live,
      role: worldRole(meta.role),
    });
  }
  return out.sort(
    (a, b) => Number(b.live) - Number(a.live) || b.savedAt - a.savedAt,
  );
}

/** The world being played, by the marker (it may have no save yet). */
function liveHash(settings: Settings): string | null {
  try {
    return (
      fs
        .readFileSync(path.join(worldsRoot(settings), "_live"), "utf8")
        .trim() || null
    );
  } catch {
    return null;
  }
}

function worldDir(settings: Settings, hash: string): string {
  validateWorldHash(hash);
  if (hash.startsWith(".") || hash.startsWith("_"))
    throw new Error(`not a world: ${hash}`);
  return path.join(worldsRoot(settings), hash);
}

// ---------------------------------------------------------------- operations

async function reloadRenderer(
  getWindow: () => BrowserWindow | null,
  sim: { port: number; commandToken: string },
): Promise<void> {
  const win = getWindow();
  if (!win) return;
  await loadRenderer(
    win,
    path.join(__dirname, "..", "renderer", "index.html"),
    {
      desktop: "1",
      api: `127.0.0.1:${sim.port}`,
      token: sim.commandToken,
    },
  );
}

async function checkpoint(port: number): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/save`, {
      method: "POST",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`world checkpoint failed (${response.status})`);
  } finally {
    clearTimeout(timer);
  }
}

async function restartPrevious(settings: Settings): Promise<string | null> {
  try {
    await startSim(settings);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Play another world that is already on disk. */
async function openWorld(
  getWindow: () => BrowserWindow | null,
  hash: string,
): Promise<{ opened: boolean }> {
  const settings = loadSettings();
  const dir = worldDir(settings, hash);
  if (liveHash(settings) === hash) return { opened: false };
  // A save the simulation cannot read would be set aside and replaced by a
  // fresh world under the same name: check it before switching.
  const expected = await validateWorldSaveBytesInWorker(
    await fs.promises.readFile(path.join(dir, "world.save")),
  );
  // The checkpoint also writes the first save of a world that has none yet.
  if (!(await checkpointActiveSim()))
    throw new Error("could not save the current world before switching");
  const active = resolveActiveWorldFiles(effectiveDataRoot(settings));

  const token = randomUUID();
  const marker = active.markerPath;
  const prepared = `${marker}.next-${token}`;
  const rollback = `${marker}.rollback-${token}`;
  let stopped = false;
  let lock: DataRootLock | null = null;
  try {
    await stopSim(5_000, true);
    stopped = true;
    lock = acquireDataRootLock(effectiveDataRoot(settings));
    atomicWriteNewFile(prepared, hash);
    fs.renameSync(marker, rollback);
    fs.renameSync(prepared, marker);
    syncDirectoryBestEffort(path.dirname(marker));
    const handed = lock;
    lock = null;
    const sim = await startSimWithDataRootLock(settings, handed);
    await checkpoint(sim.port);
    const loaded = await validateWorldSaveBytesInWorker(
      await fs.promises.readFile(path.join(dir, "world.save")),
    );
    if (
      loaded.seedText !== expected.seedText ||
      BigInt(loaded.tickText) < BigInt(expected.tickText)
    ) {
      throw new Error(`the simulation did not load world ${hash} as saved`);
    }
    await reloadRenderer(getWindow, sim);
    fs.unlinkSync(rollback);
    syncDirectoryBestEffort(path.dirname(marker));
    return { opened: true };
  } catch (error) {
    if (stopped) await stopSim().catch(() => {});
    let rollbackError: string | null = null;
    try {
      if (fs.existsSync(rollback)) {
        fs.renameSync(rollback, marker);
        syncDirectoryBestEffort(path.dirname(marker));
      }
      if (fs.existsSync(prepared)) fs.unlinkSync(prepared);
    } catch (failure) {
      rollbackError =
        failure instanceof Error ? failure.message : String(failure);
    }
    lock?.release();
    lock = null;
    const restartError = rollbackError
      ? null
      : stopped
        ? await restartPrevious(settings)
        : null;
    if (!rollbackError && stopped && !restartError) {
      const sim = activeSim();
      if (sim) await reloadRenderer(getWindow, sim).catch(() => {});
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}` +
        (restartError
          ? `. The previous world also failed to restart: ${restartError}`
          : "") +
        (rollbackError
          ? `. The previous world marker could not be restored: ${rollbackError}`
          : ""),
    );
  } finally {
    lock?.release();
  }
}

/** Start a new world (the current one stays in the list), with an optional seed and population limit. */
async function createWorld(
  getWindow: () => BrowserWindow | null,
  options: {
    seed?: string | null;
    populationCap?: number | null;
    name?: string | null;
    role?: WorldRole | null;
  },
): Promise<{ created: boolean; hash: string; seed: string }> {
  const previous = loadSettings();
  // The new world starts with the chosen limit; it is kept in the settings
  // only once the world is there.
  const cap = options.populationCap;
  const settings: Settings =
    typeof cap === "number" && Number.isFinite(cap)
      ? {
          ...previous,
          populationCap: Math.min(Math.max(Math.round(cap), 120), 5000),
        }
      : previous;
  const seed = seedFromText(options.seed);
  if (!(await checkpointActiveSim()))
    throw new Error(
      "could not save the current world before starting a new one",
    );
  const active = resolveActiveWorldFiles(effectiveDataRoot(settings));

  const token = randomUUID();
  const parkedMarker = `${active.markerPath}.reset-${token}`;
  let stopped = false;
  let lock: DataRootLock | null = null;
  try {
    await stopSim(5_000, true);
    stopped = true;
    lock = acquireDataRootLock(effectiveDataRoot(settings));
    fs.renameSync(active.markerPath, parkedMarker);
    syncDirectoryBestEffort(path.dirname(active.markerPath));
    const handed = lock;
    lock = null;
    setPendingWorldSeed(seed);
    let sim;
    try {
      sim = await startSimWithDataRootLock(settings, handed);
    } finally {
      setPendingWorldSeed(null);
    }
    await checkpoint(sim.port);
    const fresh = resolveActiveWorldFiles(effectiveDataRoot(settings));
    if (fresh.hash === active.hash)
      throw new Error(
        `the new world reselected the previous world ${active.hash}`,
      );
    const loaded = await validateWorldSaveBytesInWorker(
      await fs.promises.readFile(fresh.savePath),
    );
    if (loaded.seedText === "0")
      throw new Error("the new world has no stable seed");
    if (seed && loaded.seedText !== seed) {
      throw new Error(
        `the new world has seed ${loaded.seedText}, expected ${seed}`,
      );
    }
    const name = (options.name ?? "").trim().slice(0, MAX_NAME);
    const role = worldRole(options.role);
    writeMeta(path.dirname(fresh.savePath), {
      ...(name ? { name } : {}),
      seed: loaded.seedText,
      createdAt: Date.now(),
      ...(role ? { role } : {}),
    });
    await reloadRenderer(getWindow, sim);
    fs.unlinkSync(parkedMarker);
    syncDirectoryBestEffort(path.dirname(active.markerPath));
    if (settings !== previous) saveSettings(settings);
    return { created: true, hash: fresh.hash, seed: loaded.seedText };
  } catch (error) {
    if (stopped) await stopSim().catch(() => {});
    let rollbackError: string | null = null;
    if (fs.existsSync(parkedMarker)) {
      try {
        lock ??= acquireDataRootLock(effectiveDataRoot(settings));
        restoreParkedLiveWorld(
          worldsRoot(settings),
          parkedMarker,
          active.hash,
          token,
        );
      } catch (failure) {
        rollbackError =
          failure instanceof Error ? failure.message : String(failure);
      }
    }
    lock?.release();
    lock = null;
    const restartError = rollbackError
      ? null
      : stopped
        ? await restartPrevious(previous)
        : null;
    if (!rollbackError && stopped && !restartError) {
      const sim = activeSim();
      if (sim) await reloadRenderer(getWindow, sim).catch(() => {});
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}` +
        (restartError
          ? `. The previous world also failed to restart: ${restartError}`
          : "") +
        (rollbackError
          ? `. The previous world marker could not be restored: ${rollbackError}`
          : ""),
    );
  } finally {
    lock?.release();
  }
}

function renameWorld(hash: string, name: string): WorldSlot[] {
  const settings = loadSettings();
  const dir = worldDir(settings, hash);
  if (
    !fs.existsSync(path.join(dir, "world.save")) &&
    liveHash(settings) !== hash
  )
    throw new Error(`no world ${hash}`);
  const meta = readMeta(dir);
  const trimmed = name.trim().slice(0, MAX_NAME);
  if (trimmed) meta.name = trimmed;
  else delete meta.name;
  writeMeta(dir, meta);
  return listWorlds(worldsRoot(settings));
}

/** Remember how the player plays a world; the list comes back with it. */
export function setWorldRole(
  worldsDir: string,
  hash: string,
  role: unknown,
): WorldSlot[] {
  validateWorldHash(hash);
  if (hash.startsWith(".") || hash.startsWith("_"))
    throw new Error(`not a world: ${hash}`);
  const checked = worldRole(role);
  if (!checked) throw new Error(`unknown role: ${String(role)}`);
  const dir = path.join(worldsDir, hash);
  // The world being played has a folder from its first moment, before any save.
  if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory())
    throw new Error(`no world ${hash}`);
  writeMeta(dir, { ...readMeta(dir), role: checked });
  return listWorlds(worldsDir);
}

/** Move a world that is not being played to the Trash (it can be put back from there). */
async function trashWorld(hash: string): Promise<WorldSlot[]> {
  const settings = loadSettings();
  const dir = worldDir(settings, hash);
  if (liveHash(settings) === hash)
    throw new Error("the world being played cannot be deleted");
  if (!fs.existsSync(path.join(dir, "world.save")))
    throw new Error(`no world ${hash}`);
  await shell.trashItem(dir);
  return listWorlds(worldsRoot(settings));
}

/** Called from registerIpc in ./ipc. */
export function registerForkWorlds(
  ipc: IpcMain,
  getWindow: () => BrowserWindow | null,
): void {
  const exclusive =
    <TArgs extends unknown[], TResult>(
      name: string,
      handler: (...args: TArgs) => Promise<TResult> | TResult,
    ) =>
    (...args: TArgs) =>
      runExclusiveDesktopOperation(name, () => handler(...args));

  ipc.handle("fork:worlds:list", () => listWorlds(worldsRoot(loadSettings())));
  ipc.handle(
    "fork:worlds:open",
    exclusive("open another world", (_e, hash: unknown) =>
      openWorld(getWindow, String(hash)),
    ),
  );
  ipc.handle(
    "fork:worlds:create",
    exclusive("start a new world", (_e, options: unknown) => {
      const o = (options ?? {}) as {
        seed?: unknown;
        populationCap?: unknown;
        name?: unknown;
        role?: unknown;
      };
      return createWorld(getWindow, {
        seed: typeof o.seed === "string" ? o.seed : null,
        populationCap:
          typeof o.populationCap === "number" ? o.populationCap : null,
        name: typeof o.name === "string" ? o.name : null,
        role: worldRole(o.role),
      });
    }),
  );
  ipc.handle(
    "fork:worlds:rename",
    exclusive("rename a world", (_e, hash: unknown, name: unknown) =>
      renameWorld(String(hash), String(name ?? "")),
    ),
  );
  ipc.handle(
    "fork:worlds:set-role",
    exclusive("choose how to play a world", (_e, hash: unknown, role: unknown) =>
      setWorldRole(worldsRoot(loadSettings()), String(hash), role),
    ),
  );
  ipc.handle(
    "fork:worlds:trash",
    exclusive("delete a world", (_e, hash: unknown) =>
      trashWorld(String(hash)),
    ),
  );
}
