import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMarket, withMarket } from "@/lib/market";
import { REF_COOKIE } from "@/lib/rewards";

// A referral share link (e.g. ratnavue.com/r/AB12CD3, or /lk/r/AB12CD3 —
// the proxy strips/stamps the prefix the same as any other page). Sets a
// cookie the code survives browsing in and redirects home; both sign-up
// paths (registerCustomer and the events.createUser hook in lib/auth.ts)
// read it at account-creation time — see captureReferral in lib/rewards.ts.
const REF_COOKIE_MAX_AGE_DAYS = 30;

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const market = await getMarket();

  const cookieStore = await cookies();
  cookieStore.set(REF_COOKIE, code.trim().toUpperCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REF_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.redirect(new URL(withMarket("/", market), req.url));
}
