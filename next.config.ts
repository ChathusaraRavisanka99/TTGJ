import type { NextConfig } from "next";

// No remotePatterns needed: every uploaded image is served from our own
// origin at /media/[filename] (see app/media/[filename]/route.ts), not a
// direct Supabase Storage URL, so next/image treats it as a same-origin
// local image with no extra config.
const nextConfig: NextConfig = {};

export default nextConfig;
