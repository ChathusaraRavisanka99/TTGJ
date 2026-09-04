import type { NextConfig } from "next";

// Derived from DATABASE_URL/DIRECT_URL's project ref rather than hardcoded,
// so this doesn't need editing by hand for a different Supabase project —
// same host either way (SUPABASE_URL, when set, points at the identical
// <project-ref>.supabase.co domain).
function supabaseHostname(): string | null {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? process.env.SUPABASE_URL;
  const match = url?.match(/([a-z0-9-]+)\.supabase\.co/);
  return match ? `${match[1]}.supabase.co` : null;
}

const supabaseHost = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/media/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
