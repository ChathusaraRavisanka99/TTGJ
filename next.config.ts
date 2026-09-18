import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// No remotePatterns needed: every uploaded image is served from our own
// origin at /media/[filename] (see app/media/[filename]/route.ts), not a
// direct Supabase Storage URL, so next/image treats it as a same-origin
// local image with no extra config.
const nextConfig: NextConfig = {};

// Resolves src/i18n/request.ts (see its own comment) for both the server
// and client bundles — needed even though this app has no [locale] URL
// routing, since next-intl still needs to know where its request config
// lives.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
