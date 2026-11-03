import { contextBridge, ipcRenderer, webUtils } from "electron";

// Sandboxed preloads cannot require sibling files. Keep this inlined.
function getPlatform(): "linux" | "mac" | "win" {
  switch (process.platform) {
    case "darwin":
    case "sunos":
      return "mac";
    case "win32":
      return "win";
    default:
      return "linux";
  }
}

type RendererListener = (...args: any[]) => any;
type IpcWrapper = (event: Electron.IpcRendererEvent, args: unknown) => void;

const wrappers = new Map<string, Map<RendererListener, IpcWrapper>>();

function subscribe(command: string, func: RendererListener): void {
  let byFunc = wrappers.get(command);
  if (!byFunc) {
    byFunc = new Map();
    wrappers.set(command, byFunc);
  }
  const previous = byFunc.get(func);
  if (previous) ipcRenderer.removeListener(command, previous);
  const wrapper: IpcWrapper = (event, args) => {
    func(event, args);
  };
  byFunc.set(func, wrapper);
  ipcRenderer.on(command, wrapper);
}

function unsubscribe(command: string, func: RendererListener): void {
  const byFunc = wrappers.get(command);
  const wrapper = byFunc?.get(func);
  if (!wrapper || !byFunc) return;
  ipcRenderer.removeListener(command, wrapper);
  byFunc.delete(func);
}

const mediaToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
ipcRenderer.send("media-register-token", mediaToken);

function resolveDroppedFile(file: File): string {
  const filePath = webUtils.getPathForFile(file);
  if (!filePath) return "";
  ipcRenderer.send("media-allow-dropped", { token: mediaToken, filePath });
  return filePath;
}

contextBridge.exposeInMainWorld("electron", {
  send: (command: string, payload?: unknown) => {
    ipcRenderer.send(command, payload);
  },
  on: (command: string, func: RendererListener) => {
    subscribe(command, func);
  },
  off: (command: string, func: RendererListener) => {
    unsubscribe(command, func);
  },
  invoke: (command: string, payload?: unknown) =>
    ipcRenderer.invoke(command, payload),
  platform: getPlatform(),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  resolveDroppedFile,
});
