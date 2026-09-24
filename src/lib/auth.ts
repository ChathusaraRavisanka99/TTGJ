import NextAuth, { CredentialsSignin } from "next-auth";
import { isUserDisabled } from "@/lib/user-status";
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

export class AccountDisabledError extends CredentialsSignin {
  code = "account_disabled";
}

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
        // Only reached with the right password, so this never confirms to
        // a stranger that an email belongs to a (disabled) account.
        if (isUserDisabled(user)) throw new AccountDisabledError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          staffMarketScope: user.staffMarketScope as "intl" | "lk" | "both" | null,
          staffPermissions: user.staffPermissions,
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
    // Google sign-in has no password step to hang the disabled check on, so
    // it's refused here for an existing account that's currently disabled.
    // (Credentials sign-in is handled in authorize() above with its own,
    // clearer message.)
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { disabledAt: true, disabledUntil: true } });
      return !isUserDisabled(existing);
    },
    // Overrides auth.config.ts's jwt callback: same "embed role at
    // sign-in" behaviour, plus a Prisma fallback for tokens that predate
    // the role field. Prisma is only available here (Node runtime, not
    // Edge) — middleware uses the config without this branch.
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.id = user.id;
        token.staffMarketScope = (user as { staffMarketScope?: string | null }).staffMarketScope ?? null;
        token.staffPermissions = (user as { staffPermissions?: string[] }).staffPermissions ?? [];
      } else if (token.id && (!token.role || token.role === "STAFF")) {
        // A STAFF token is re-read from the database every time, so an
        // admin changing their permissions or market scope, or revoking
        // them, takes effect on their very next request rather than
        // whenever the token happens to be reissued. Only STAFF pays this
        // lookup; the edge proxy still sees the sign-in copy, which is why
        // the layout and every action re-check.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, staffMarketScope: true, staffPermissions: true, disabledAt: true, disabledUntil: true },
        });
        // A disabled staff member loses every back-office right at once.
        const disabled = isUserDisabled(dbUser);
        token.role = disabled ? "CUSTOMER" : (dbUser?.role ?? "CUSTOMER");
        token.staffMarketScope = disabled ? null : (dbUser?.staffMarketScope ?? null);
        token.staffPermissions = disabled ? [] : (dbUser?.staffPermissions ?? []);
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
