import { protocol } from "electron";
import fs from "fs";
import path from "path";
import electronIsDev from "electron-is-dev";
import {
  filesystemPathFromMediaUrl,
  isAllowedMediaPath,
} from "./media-allowlist";

const ASSET_PREFIXES = ["/_next", "/static"];

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".wasm": "application/wasm",
  ".avif": "image/avif",
};

export function registerPrivilegedSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "public",
      privileges: {
        standard: false,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true,
      },
    },
    {
      scheme: "media",
      privileges: {
        standard: false,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

function isInside(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  return (
    resolvedCandidate === resolvedRoot ||
    resolvedCandidate.startsWith(resolvedRoot + path.sep)
  );
}

function pathnameFromFileUrl(requestUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "file:") return null;
  let pathname = parsed.pathname;
  if (process.platform === "win32" && /^\/[A-Za-z]:/.test(pathname)) {
    pathname = pathname.slice(1);
  }
  return pathname;
}

/**
 * Next's static export references /_next and /static from the site root.
 * Only those paths, and other files inside the renderer out directory, are
 * served. Image previews use the media:// allowlist instead.
 */
export function resolveFileProtocolPath(
  requestUrl: string,
  outDir: string,
): string | null {
  const pathname = pathnameFromFileUrl(requestUrl);
  if (!pathname) return null;
  const normalized = pathname.replace(/\\/g, "/");
  for (const prefix of ASSET_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      const relative = normalized.replace(/^\/+/, "");
      const resolved = path.resolve(outDir, relative);
      if (!isInside(outDir, resolved)) return null;
      return resolved;
    }
  }
  return pathname;
}

async function readFileResponse(filePath: string): Promise<Response> {
  try {
    const data = await fs.promises.readFile(filePath);
    const type =
      MIME_TYPES[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: { "content-type": type },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export function installProtocolHandlers(rendererDir: string): void {
  const outDir = path.join(rendererDir, "out");
  const publicDir = electronIsDev
    ? path.join(rendererDir, "public")
    : outDir;

  if (!electronIsDev) {
    protocol.handle("file", (request) => {
      const resolved = resolveFileProtocolPath(request.url, outDir);
      if (!resolved) {
        return new Response("Bad request", { status: 400 });
      }
      if (isInside(outDir, resolved)) {
        return readFileResponse(resolved);
      }
      return new Response("Forbidden", { status: 403 });
    });
  }

  protocol.handle("media", (request) => {
    const filePath = filesystemPathFromMediaUrl(request.url);
    if (!filePath || !isAllowedMediaPath(filePath)) {
      return new Response("Forbidden", { status: 403 });
    }
    return readFileResponse(filePath);
  });

  protocol.handle("public", (request) => {
    const withoutScheme = request.url.replace(/^public:\/\//i, "");
    let decoded = withoutScheme;
    try {
      decoded = decodeURIComponent(withoutScheme);
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    const relative = decoded.replace(/^\/+/, "");
    if (relative.includes("\0")) {
      return new Response("Bad request", { status: 400 });
    }
    const resolved = path.resolve(publicDir, relative);
    if (!isInside(publicDir, resolved)) {
      return new Response("Forbidden", { status: 403 });
    }
    return readFileResponse(resolved);
  });
}
