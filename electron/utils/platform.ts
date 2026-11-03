export type DesktopPlatform = "linux" | "mac" | "win";

/**
 * process.platform is available in the main process and in a sandboxed
 * preload. os.platform() is not, after Electron 45 removed Node shims there.
 */
export const getPlatform = (): DesktopPlatform => {
  switch (process.platform) {
    case "darwin":
    case "sunos":
      return "mac";
    case "win32":
      return "win";
    default:
      return "linux";
  }
};

export const getArch = (): string => {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "ia32":
      return "x86";
    case "arm":
      return "arm";
    case "arm64":
      return "arm64";
    default:
      return process.arch;
  }
};
