import type { BrowserWindow, IpcMain } from "electron";
import { registerForkDevice } from "./fork-device";
import { registerForkPower } from "./fork-power";
import { registerForkWorlds } from "./fork-worlds";

/** The fork's IPC handlers (worlds, device profile, power), registered with upstream's in ipc.ts. */
export function registerForkIpc(ipc: IpcMain, getWindow: () => BrowserWindow | null): void {
  registerForkWorlds(ipc, getWindow);
  registerForkDevice(ipc);
  registerForkPower(ipc);
}
