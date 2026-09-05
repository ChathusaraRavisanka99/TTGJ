import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Deliberately NOT `import { auth } from "@/lib/auth"` — that config pulls
// in PrismaAdapter, Prisma Client, and the Credentials/Google providers
// (bcryptjs included), none of which run on the Edge runtime and all of
// which together push the middleware bundle past Vercel's Edge Function
// size limit. Middleware only ever needs to read/verify the existing
// session JWT, which needs no providers at all — so it gets its own
// `auth()` built from just the edge-safe slice of the config.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/account/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/account") && !pathname.startsWith("/account/login") && !pathname.startsWith("/account/register")) {
    if (!req.auth) {
      const loginUrl = new URL("/account/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // /checkout/return and /checkout/cancel are PayHere's own redirect
  // targets (the customer's browser lands there straight from PayHere's
  // hosted page) — still gated, since both just look up the signed-in
  // customer's own order, but never /api/payhere/notify, which is a
  // server-to-server webhook with no browser session at all.
  if (pathname.startsWith("/checkout")) {
    if (!req.auth) {
      const loginUrl = new URL("/account/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
