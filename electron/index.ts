import log from "electron-log/main";
import { app, ipcMain, session } from "electron";
import { ELECTRON_COMMANDS } from "../common/electron-commands";
import logit from "./utils/logit";
import openFolder from "./commands/open-folder";
import stop from "./commands/stop";
import selectFolder from "./commands/select-folder";
import selectFile from "./commands/select-file";
import getModelsList from "./commands/get-models-list";
import customModelsSelect from "./commands/custom-models-select";
import imageUpscayl from "./commands/image-upscayl";
import { createMainWindow } from "./main-window";
import { execPath, modelsPath } from "./utils/get-resource-paths";
import batchUpscayl from "./commands/batch-upscayl";
import doubleUpscayl from "./commands/double-upscayl";
import autoUpdate from "./commands/auto-update";
import { FEATURE_FLAGS } from "../common/feature-flags";
import settings from "electron-settings";
import pasteImage from "./commands/paste-image";
import { prepareRenderer } from "./utils/prepare-renderer";
import { registerPrivilegedSchemes } from "./utils/protocols";
import { getDeviceSpecsFromGpu } from "./utils/get-device-specs";
import { autoUpdater } from "electron-updater";

// The renderer logger (electron-log/renderer) needs this preload. The script
// only uses ipcRenderer and contextBridge, which sandboxed preloads still have.
log.initialize({ preload: true });

registerPrivilegedSchemes();

if (FEATURE_FLAGS.APP_STORE_BUILD) {
  logit("\ud83d\ude80 APP STORE BUILD ENABLED");
  app.commandLine.appendSwitch("in-process-gpu");
}

const ALLOWED_PERMISSIONS = new Set([
  "clipboard-read",
  "clipboard-sanitized-write",
]);

app.whenReady().then(async () => {
  await prepareRenderer();

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(ALLOWED_PERMISSIONS.has(permission));
    },
  );

  createMainWindow();

  log.info(
    "\ud83c\udd99 Upscayl version:",
    app.getVersion(),
    FEATURE_FLAGS.APP_STORE_BUILD ? "MAC-APP-STORE" : "FOSS",
    "Electron",
    process.versions.electron,
  );
  log.info("\ud83d\ude80 UPSCAYL EXEC PATH: ", execPath);
  log.info("\ud83d\ude80 MODELS PATH: ", modelsPath);

  let closeAccess;
  const folderBookmarks = await settings.get("folder-bookmarks");
  if (FEATURE_FLAGS.APP_STORE_BUILD && folderBookmarks) {
    logit("\ud83d\udea8 Folder Bookmarks: ", folderBookmarks);
    try {
      closeAccess = app.startAccessingSecurityScopedResource(
        folderBookmarks as string,
      );
    } catch (error) {
      logit("\ud83d\udcc1 Folder Bookmarks Error: ", error);
    }
  }
  void closeAccess;
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on(ELECTRON_COMMANDS.STOP, stop);

ipcMain.on(ELECTRON_COMMANDS.OPEN_FOLDER, openFolder);

ipcMain.handle(ELECTRON_COMMANDS.SELECT_FOLDER, selectFolder);

ipcMain.handle(ELECTRON_COMMANDS.SELECT_FILE, selectFile);

ipcMain.on(ELECTRON_COMMANDS.GET_MODELS_LIST, getModelsList);

ipcMain.handle(
  ELECTRON_COMMANDS.SELECT_CUSTOM_MODEL_FOLDER,
  customModelsSelect,
);

ipcMain.on(ELECTRON_COMMANDS.UPSCAYL, imageUpscayl);

ipcMain.on(ELECTRON_COMMANDS.FOLDER_UPSCAYL, batchUpscayl);

ipcMain.on(ELECTRON_COMMANDS.DOUBLE_UPSCAYL, doubleUpscayl);

ipcMain.on(ELECTRON_COMMANDS.PASTE_IMAGE, pasteImage);

ipcMain.handle("get-gpu-info", async () => {
  try {
    return await app.getGPUInfo("complete");
  } catch (error) {
    console.error("Failed to get GPU info:", error);
    return null;
  }
});

ipcMain.handle("get-system-info", async () => {
  let gpuInfo: { gpuDevice?: Array<Record<string, unknown>> } | null = null;
  try {
    gpuInfo = (await app.getGPUInfo("complete")) as {
      gpuDevice?: Array<Record<string, unknown>>;
    };
  } catch (error) {
    console.error("Failed to get GPU info:", error);
  }
  return getDeviceSpecsFromGpu(gpuInfo);
});

ipcMain.handle("get-app-version", () => {
  return `${app.getVersion()} ${
    FEATURE_FLAGS.APP_STORE_BUILD ? "MAC-APP-STORE" : "FOSS"
  } (Electron ${process.versions.electron})`;
});

if (FEATURE_FLAGS.ENABLE_AUTO_UPDATE && !FEATURE_FLAGS.APP_STORE_BUILD) {
  autoUpdater.on("update-downloaded", autoUpdate);
} else {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
}
