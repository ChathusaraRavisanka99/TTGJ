import type { NextAuthConfig } from "next-auth";

// The edge-safe slice of the NextAuth config: no PrismaAdapter, no
// Credentials/Google providers, no bcryptjs — none of that runs on the
// Edge runtime (Prisma needs a raw Postgres connection Edge can't open;
// bcryptjs alone is enough bulk to blow the bundle past a 1MB Edge
// Function). This is imported by BOTH:
//   - src/middleware.ts, directly, to build a lightweight `auth()` that
//     only reads/verifies the existing session JWT — it never needs a
//     provider to do that, since sign-in itself happens through the
//     Node-runtime /api/auth route, not through middleware.
//   - src/lib/auth.ts, spread into the full config alongside the adapter
//     and providers, so the two configs can't drift apart.
//
// The `jwt` callback here deliberately has NO database fallback (unlike
// the full config's) — it only ever needs to read `token.role`, already
// embedded in the JWT from the original sign-in. A DB lookup belongs in
// the full config, which actually has Prisma available.
export default {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 60 * 30, // 30 minutes
  },
  pages: {
    signIn: "/account/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
