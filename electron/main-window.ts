import { app, BrowserWindow, shell } from "electron";
import { getPlatform } from "./utils/get-device-specs";
import { join } from "path";
import { pathToFileURL } from "url";
import { ELECTRON_COMMANDS } from "../common/electron-commands";
import { fetchLocalStorage } from "./utils/config-variables";
import electronIsDev from "electron-is-dev";
import { autoUpdater } from "electron-updater";
import { FEATURE_FLAGS } from "../common/feature-flags";
import { RENDERER_DEV_URL } from "./utils/prepare-renderer";

let mainWindow: BrowserWindow | undefined;

const allowedNavigation = (url: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === "file:" || parsed.protocol === "public:") {
    return true;
  }
  if (
    parsed.protocol === "http:" &&
    (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
    parsed.port === "8000"
  ) {
    return true;
  }
  return false;
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    icon: join(__dirname, "../build/icon.png"),
    width: 1300,
    height: 940,
    minHeight: 500,
    minWidth: 600,
    show: false,
    backgroundColor: "#171717",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: false,
      allowRunningInsecureContent: false,
    },
    titleBarStyle: getPlatform() === "mac" ? "hiddenInset" : "default",
  });

  const url = electronIsDev
    ? RENDERER_DEV_URL
    : pathToFileURL(
        join(__dirname, "../../renderer/out/index.html"),
      ).toString();

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (!allowedNavigation(targetUrl)) {
      shell.openExternal(targetUrl);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (allowedNavigation(targetUrl)) return;
    event.preventDefault();
    shell.openExternal(targetUrl);
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow.show();
  });

  fetchLocalStorage();

  if (
    !electronIsDev &&
    FEATURE_FLAGS.ENABLE_AUTO_UPDATE &&
    !FEATURE_FLAGS.APP_STORE_BUILD
  ) {
    mainWindow.webContents
      .executeJavaScript('localStorage.getItem("autoUpdate");', true)
      .then((lastSaved: string | null) => {
        if (
          lastSaved === null ||
          lastSaved === undefined ||
          lastSaved === "true"
        ) {
          autoUpdater.checkForUpdates();
        }
      });
  }

  mainWindow.webContents.send(ELECTRON_COMMANDS.OS, getPlatform());
  mainWindow.setMenuBarVisibility(false);
};

const getMainWindow = () => {
  return mainWindow;
};

export { createMainWindow, getMainWindow };
