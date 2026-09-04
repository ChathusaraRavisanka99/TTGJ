import { S3Client } from "@aws-sdk/client-s3";

// Server-only Supabase Storage client, used for uploads (see lib/media.ts).
// Talks to Supabase Storage's S3-compatible endpoint (Storage → S3
// Connection in the dashboard) rather than the supabase-js REST client —
// this project's storage bucket lives in a separate Supabase project from
// the database, and S3 access keys were what was available for it. S3
// access keys bypass Row Level Security the same way a service_role key
// does, so this must never be imported from client code or exposed via
// NEXT_PUBLIC_*; every call site is a Server Action or Route Handler.
let cached: S3Client | null = null;

export function storageClient(): S3Client {
  if (cached) return cached;

  const endpoint = process.env.SUPABASE_STORAGE_ENDPOINT;
  const region = process.env.SUPABASE_STORAGE_REGION;
  const accessKeyId = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "SUPABASE_STORAGE_ENDPOINT, SUPABASE_STORAGE_REGION, SUPABASE_STORAGE_ACCESS_KEY_ID and SUPABASE_STORAGE_SECRET_ACCESS_KEY must be set — uploads are stored in Supabase Storage (via its S3-compatible endpoint), not on local disk, so both host and local environments read/write the same place.",
    );
  }

  cached = new S3Client({
    forcePathStyle: true,
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

export const MEDIA_BUCKET = "media";

// No public bucket URL here on purpose: the app never links a browser
// directly to Supabase Storage. Every upload is served through our own
// /media/[filename] route (app/media/[filename]/route.ts), which reads
// objects using this same S3 client — so the bucket can stay private
// indefinitely with no dashboard "Public bucket" toggle to remember.
