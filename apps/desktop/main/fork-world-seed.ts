// Fork: the seed of a world being created, handed from fork-worlds.ts to the
// simulation's environment (sim-env.ts). Kept apart so sim-env stays free of
// Electron imports.
let pendingSeed: string | null = null;

/** Set while a new world starts; null otherwise. */
export function setPendingWorldSeed(seed: string | null): void {
  pendingSeed = seed;
}

/** Extra environment for the next simulation start: the seed of a world being created. */
export function worldSeedEnv(): Record<string, string> {
  return pendingSeed ? { THB_WORLD_SEED: pendingSeed } : {};
}
