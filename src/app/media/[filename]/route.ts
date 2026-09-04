import { GetObjectCommand } from "@aws-sdk/client-s3";
import { storageClient, MEDIA_BUCKET } from "@/lib/supabase";
import { readCached, writeCached } from "@/lib/media-cache";

// Every uploaded image/video/PDF is served through here rather than a
// direct Supabase Storage URL (see lib/supabase.ts and lib/media.ts) —
// local cache first (instant, the common case), falling back to Storage
// (the durable source of truth) on a miss and repopulating the cache for
// next time. This is also what lets the "media" bucket stay private: only
// this server-side S3 client ever reads it.

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

function fileResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeFor(filename),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function GET(_req: Request, ctx: RouteContext<"/media/[filename]">) {
  const { filename } = await ctx.params;

  const cached = await readCached(filename);
  if (cached) return fileResponse(cached, filename);

  try {
    const result = await storageClient().send(new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: filename }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) return new Response("Not found", { status: 404 });

    const buffer = Buffer.from(bytes);
    void writeCached(filename, buffer);
    return fileResponse(buffer, filename);
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (/NoSuchKey|NotFound/i.test(name)) return new Response("Not found", { status: 404 });
    console.error(`Media fetch failed for ${filename}:`, err);
    return new Response("Storage error", { status: 502 });
  }
}
