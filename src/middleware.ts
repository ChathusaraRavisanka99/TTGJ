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

// Known legitimate non-browser clients that must still get through —
// search engine crawlers (so the sitemap-driven discoverability these
// pages are built for actually works) and the link-preview bots chat
// apps use to render an OG card when someone shares a /collections URL.
const ALLOWED_BOT_UA = /googlebot|bingbot|duckduckbot|slurp|baiduspider|yandexbot|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot/i;

// A handful of common non-browser HTTP client signatures. This is a
// speed bump against casual scraping, not real security — curl (or
// anything else) can trivially set `-A "Mozilla/5.0 ..."` and sail
// through, since a User-Agent is just a header the client chooses to
// send. It's scoped to /collections only: these are the hidden pages
// meant to be found by a person following a link, not queried directly.
const NON_BROWSER_UA = /^curl\/|^wget\/|python-requests|python-urllib|okhttp|go-http-client|java\/|apache-httpclient|libwww-perl|postmanruntime|insomnia|httpie|^axios\/|node-fetch/i;

function isBrowserRequest(userAgent: string): boolean {
  if (!userAgent) return false;
  if (ALLOWED_BOT_UA.test(userAgent)) return true;
  if (NON_BROWSER_UA.test(userAgent)) return false;
  // Every real desktop/mobile browser (Chrome, Firefox, Safari, Edge)
  // includes "Mozilla/5.0" for historical compatibility reasons — a
  // request without it almost certainly isn't one.
  return /mozilla/i.test(userAgent);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/collections")) {
    const userAgent = req.headers.get("user-agent") ?? "";
    if (!isBrowserRequest(userAgent)) {
      // Reads as though the route doesn't exist, same as a page that's
      // actually Hidden — no hint that a stricter check exists at all.
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // Includes the query string (e.g. ?highlight=ORD-...), not just the
  // bare pathname — otherwise a redirect like /account/orders?highlight=
  // loses that param on the round trip through login and a customer
  // sent back here after re-authenticating lands on the plain list
  // instead of their highlighted order (the hash portion, if any, is
  // never sent to the server at all — that part of the round trip is an
  // inherent browser limitation, not something this can fix).
  function loginRedirect() {
    const loginUrl = new URL("/account/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth) return loginRedirect();
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/account") && !pathname.startsWith("/account/login") && !pathname.startsWith("/account/register")) {
    if (!req.auth) return loginRedirect();
  }

  // Only the checkout form itself (building an order from *your* cart)
  // needs a session. /checkout/return and /checkout/cancel are PayHere's
  // own redirect targets — the browser lands there straight from
  // PayHere's hosted page, which may not carry this app's session
  // cookie (a different tab/context, a mobile card-issuer 3DS redirect,
  // etc.) — so they're deliberately public. That's safe specifically
  // because neither page ever renders order details: they look up the
  // order by its high-entropy internal id (not the guessable sequential
  // order number) and show only a status, handing off to the
  // authenticated /account/orders for anything sensitive. See
  // getPublicOrderStatus in actions/checkout.ts.
  if (pathname === "/checkout") {
    if (!req.auth) return loginRedirect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/collections/:path*"],
};
