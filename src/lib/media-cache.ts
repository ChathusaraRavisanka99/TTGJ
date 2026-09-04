import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

// Per-instance local disk cache for uploaded media, sitting in front of
// Supabase Storage (the durable source of truth — see lib/supabase.ts and
// app/media/[filename]/route.ts). Uploads write here immediately so local
// dev and any long-lived host serve instantly with no round trip; on a
// serverless host this directory just resets per cold start, which is
// fine — a miss falls through to Storage and repopulates the cache (see
// the route handler), it never 404s just because the cache is empty.
const CACHE_DIR = path.join(process.cwd(), ".media-cache");

// Filenames here are always ours (randomUUID + a fixed extension, either
// freshly generated on upload or read back from a route param) — this
// guards against a route param smuggling a path (`../../etc/passwd`) into
// a filesystem call.
function safePath(filename: string): string {
  const base = path.basename(filename);
  if (!base || base !== filename || base === "." || base === "..") {
    throw new Error(`Invalid media filename: ${filename}`);
  }
  return path.join(CACHE_DIR, base);
}

export async function readCached(filename: string): Promise<Buffer | null> {
  try {
    return await readFile(safePath(filename));
  } catch {
    return null;
  }
}

export async function writeCached(filename: string, data: Buffer): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(safePath(filename), data);
  } catch (err) {
    // Non-fatal: Storage already has the authoritative copy by the time
    // this is called from lib/media.ts, and a route-handler cache refill
    // just means the next request tries Storage again too.
    console.warn(`Local media cache write failed for ${filename}:`, err);
  }
}

export async function deleteCached(filename: string): Promise<void> {
  try {
    await unlink(safePath(filename));
  } catch {
    // Missing/unreadable cache entry is fine — deleting the Storage
    // object is what actually matters for deleteUploadedFile().
  }
}
