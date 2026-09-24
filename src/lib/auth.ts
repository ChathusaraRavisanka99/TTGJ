import NextAuth from "next-auth";
import type { Provider } from "@auth/core/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";
import { captureReferral, REF_COOKIE } from "@/lib/rewards";
import { captureBusinessInvite, BIZ_INVITE_COOKIE } from "@/lib/business";

const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

providers.push(
  Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          staffMarketScope: user.staffMarketScope as "intl" | "lk" | "both" | null,
        };
      },
  })
);

// NextAuth's JWT strategy is one rolling session token, not a separate
// access/refresh pair — but maxAge + updateAge together (set in
// auth.config.ts, shared with middleware) produce the same effect as one:
// `updateAge` is how long the token is good for before it's silently
// re-signed (the "access" window), and each re-sign resets `maxAge` from
// that moment (the "refresh" window). So an active user is re-issued a
// fresh token every 30 minutes, and each reissue buys another full hour —
// miss that hour with no activity at all and the token is simply expired,
// no separate refresh step to run.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Overrides auth.config.ts's jwt callback: same "embed role at
    // sign-in" behaviour, plus a Prisma fallback for tokens that predate
    // the role field. Prisma is only available here (Node runtime, not
    // Edge) — middleware uses the config without this branch.
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.id = user.id;
        token.staffMarketScope = (user as { staffMarketScope?: string | null }).staffMarketScope ?? null;
      } else if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        token.role = dbUser?.role ?? "CUSTOMER";
        token.staffMarketScope = dbUser?.staffMarketScope ?? null;
      }
      return token;
    },
  },
  events: {
    // The PrismaAdapter creates a Google sign-up's User row directly,
    // bypassing registerCustomer entirely — this is the equivalent
    // referral-capture hook for that path (see actions/auth.ts for the
    // email/password side). Runs inside the OAuth callback route's own
    // request, so the ref_code cookie /r/[code] set during browsing is
    // still readable here.
    async createUser({ user }) {
      if (!user.id) return;
      const cookieStore = await cookies();
      const refCode = cookieStore.get(REF_COOKIE)?.value;
      if (refCode) await captureReferral(user.id, refCode);
      const bizInvite = cookieStore.get(BIZ_INVITE_COOKIE)?.value;
      if (bizInvite) await captureBusinessInvite(user.id, bizInvite);
    },
  },
});
