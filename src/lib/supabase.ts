import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client, used for Storage uploads (see lib/media.ts).
// The service role key bypasses Row Level Security — this must never be
// imported from client code or exposed via NEXT_PUBLIC_*; every call site
// is a Server Action or Route Handler.
let cached: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set — uploads are stored in Supabase Storage, not on local disk, so both host and local environments read/write the same place.",
    );
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export const MEDIA_BUCKET = "media";
