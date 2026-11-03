import log from "electron-log";
import { getMainWindow } from "../main-window";
import { ELECTRON_COMMANDS } from "../../common/electron-commands";

const logit = (...args: any) => {
  log.log(...args);
  const mainWindow = getMainWindow();
  if (!mainWindow) return;
  mainWindow.webContents.send(ELECTRON_COMMANDS.LOG, args.join(" "));
};

export default logit;
