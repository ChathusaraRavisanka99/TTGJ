import sharp from "sharp";
import { randomUUID } from "crypto";
import { HeadBucketCommand, CreateBucketCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { storageClient, MEDIA_BUCKET } from "@/lib/supabase";
import { writeCached, deleteCached } from "@/lib/media-cache";

// All uploads go to Supabase Storage (not local disk) so a file uploaded
// through the admin panel is readable from any environment that has these
// two env vars — local dev and a deployed host alike — rather than only
// the machine/instance that happened to receive the upload request. A
// serverless host's filesystem is ephemeral and not shared across
// instances, so local-disk storage worked in dev but silently broke (or
// lost files) once deployed.

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

// Self-provisioning: create the bucket on first use rather than requiring
// a manual dashboard step per environment — a fresh Supabase project (or a
// second one for a new deployment) works out of the box. Memoized per
// process so it's only attempted once; "already exists" from a previous
// run (or a concurrent request) is expected and ignored. Left private —
// nothing needs it public, since every read goes through our own
// /media/[filename] route (app/media/[filename]/route.ts) using this same
// S3 client, never a direct Supabase Storage URL.
let bucketReady: Promise<void> | null = null;
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const client = storageClient();
      try {
        await client.send(new HeadBucketCommand({ Bucket: MEDIA_BUCKET }));
        return;
      } catch {
        // Not found (or a transient error) — fall through and try to create it.
      }
      try {
        await client.send(new CreateBucketCommand({ Bucket: MEDIA_BUCKET }));
      } catch (err) {
        const name = (err as { name?: string; Code?: string })?.name ?? "";
        if (!/BucketAlreadyExists|BucketAlreadyOwnedByYou/i.test(name)) {
          throw new Error(`Could not create storage bucket: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    })();
  }
  return bucketReady;
}

async function upload(filename: string, buffer: Buffer, contentType: string): Promise<string> {
  const client = storageClient();
  await ensureBucket();

  // Storage is the durable copy — required, throws on failure. The local
  // cache write is a best-effort mirror on top of it (see lib/media-cache),
  // so it never blocks or fails an upload.
  await client.send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  await writeCached(filename, buffer);

  // Served by our own route, not a Supabase Storage URL — see lib/supabase.ts.
  return `/media/${filename}`;
}

// Best-effort cleanup for a replaced/removed upload — takes the stored
// media URL (as saved on the row) and deletes the matching object from
// both Storage and the local cache. Callers already treat this as
// non-critical (swallow errors with .catch(() => {})), same as the old
// local-disk unlink() calls did.
export async function deleteUploadedFile(url: string): Promise<void> {
  const filename = url.split("/").pop();
  if (!filename) return;
  const client = storageClient();
  await client.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: filename }));
  await deleteCached(filename);
}

export interface SavedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export async function saveUploadedMedia(file: File): Promise<SavedMedia> {
  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    throw new Error("Unsupported file type. Please upload a JPEG/PNG/WEBP image or an MP4/WEBM video.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  if (isImage) {
    const filename = `${id}.webp`;
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const url = await upload(filename, optimized, "image/webp");
    return { url, type: "IMAGE" };
  }

  const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const filename = `${id}.${ext}`;
  const url = await upload(filename, buffer, file.type);
  return { url, type: "VIDEO" };
}

const CERT_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

// Certification files (lab report scans) are a single attachment on the
// Gemstone itself, not a MediaAsset gallery entry — so this is deliberately
// separate from saveUploadedMedia rather than shoehorning a PDF through the
// IMAGE/VIDEO MediaType enum.
export async function saveCertificateFile(file: File): Promise<{ url: string }> {
  if (!CERT_DOCUMENT_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload a PDF, JPEG, PNG, or WEBP certificate.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  if (file.type === "application/pdf") {
    const filename = `${id}.pdf`;
    const url = await upload(filename, buffer, "application/pdf");
    return { url };
  }

  // Scanned/photographed certificates: optimize like any other image, but
  // keep more headroom than product photos so fine print stays legible.
  const filename = `${id}.webp`;
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
  const url = await upload(filename, optimized, "image/webp");
  return { url };
}

// Certification lab logos: small, square-ish trust-badge marks shown on the
// public gem page. WEBP keeps transparency (most lab marks are transparent
// PNG/SVG originals) and a much smaller cap than product photos, since this
// is an icon-sized badge, not a gallery image.
export async function saveLabLogo(file: File): Promise<{ url: string }> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload a JPEG, PNG, or WEBP logo.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const optimized = await sharp(buffer)
    .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
  const url = await upload(filename, optimized, "image/webp");
  return { url };
}
