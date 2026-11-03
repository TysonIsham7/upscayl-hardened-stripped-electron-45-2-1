import os from "os";
import { getArch, getPlatform } from "./platform";

export { getArch, getPlatform };

type GpuInfo = {
  gpuDevice?: Array<Record<string, unknown>>;
};

export const getDeviceSpecsFromGpu = (gpuInfo: GpuInfo | null) => {
  const cpus = os.cpus();
  const gpu = gpuInfo?.gpuDevice?.[0];
  return {
    platform: getPlatform(),
    release: os.release(),
    arch: getArch(),
    model: cpus[0]?.model?.trim() || "unknown",
    cpuCount: cpus.length,
    ...(gpu ? { gpu } : {}),
  };
};
