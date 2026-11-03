import { app } from "electron";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import electronIsDev from "electron-is-dev";
import { installProtocolHandlers } from "./protocols";

export const RENDERER_DEV_PORT = 8000;
export const RENDERER_DEV_URL = `http://127.0.0.1:${RENDERER_DEV_PORT}`;

let devServer: ChildProcess | undefined;

function nodeBinary(): string {
  const fromNpm = process.env.npm_node_execpath;
  if (fromNpm && fs.existsSync(fromNpm)) return fromNpm;
  return "node";
}

function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, "127.0.0.1");
      const fail = () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(
            new Error(
              `Next.js dev server did not open port ${port} within ${timeoutMs}ms`,
            ),
          );
          return;
        }
        setTimeout(attempt, 250);
      };
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", fail);
    };
    attempt();
  });
}

function stopDevServer(): void {
  if (!devServer || devServer.killed) return;
  devServer.kill("SIGTERM");
}

/**
 * Development runs Next with the system Node binary. Electron 45 embeds
 * Node 24, and Next's programmatic API is happier under the Node that
 * installed it. Production serves renderer/out over the file protocol.
 */
export async function prepareRenderer(): Promise<void> {
  const appRoot = app.getAppPath();
  const rendererDir = path.join(appRoot, "renderer");
  installProtocolHandlers(rendererDir);

  if (!electronIsDev) return;

  const nextEntry = path.join(
    appRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  if (!fs.existsSync(nextEntry)) {
    throw new Error(`Next.js CLI not found at ${nextEntry}. Run npm install.`);
  }

  devServer = spawn(
    nodeBinary(),
    [
      nextEntry,
      "dev",
      rendererDir,
      "--port",
      String(RENDERER_DEV_PORT),
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: appRoot,
      stdio: "inherit",
      env: process.env,
    },
  );
  devServer.on("error", (error) => {
    console.error("Failed to start the Next.js dev server", error);
  });
  app.on("before-quit", stopDevServer);
  app.on("will-quit", stopDevServer);
  await waitForPort(RENDERER_DEV_PORT, 120000);
}
