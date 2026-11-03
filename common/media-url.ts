import { sanitizePath } from "./sanitize-path";

/** Preview URL for a path the main process has already allowed. */
export function toMediaUrl(filePath: string): string {
  if (!filePath) return "";
  return "media:///" + sanitizePath(filePath);
}
