import fs from "fs";
import path from "path";

const allowed = new Set<string>();

export function allowMediaPath(filePath: string | null | undefined): void {
  if (!filePath) return;
  const normalized = path.resolve(filePath);
  allowed.add(normalized);
  try {
    allowed.add(path.resolve(fs.realpathSync(normalized)));
  } catch {
    // The output file may not exist until upscale finishes.
  }
}

export function isAllowedMediaPath(filePath: string): boolean {
  const normalized = path.resolve(filePath);
  if (allowed.has(normalized)) return true;
  try {
    return allowed.has(path.resolve(fs.realpathSync(normalized)));
  } catch {
    return false;
  }
}

export function filesystemPathFromMediaUrl(requestUrl: string): string | null {
  const prefix = /^media:\/\//i.exec(requestUrl);
  if (!prefix) return null;
  let rest = requestUrl.slice(prefix[0].length);
  try {
    rest = decodeURIComponent(rest);
  } catch {
    return null;
  }
  if (rest.includes("\0")) return null;
  rest = rest.replace(/\\/g, "/");
  const stripped = rest.replace(/^\/+/, "");
  if (!stripped || stripped.split("/").includes("..")) return null;
  if (/^[A-Za-z]:\//.test(stripped)) return path.resolve(stripped);
  return path.resolve("/" + stripped);
}
