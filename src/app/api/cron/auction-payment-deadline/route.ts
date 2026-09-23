import { NextResponse } from "next/server";
import { expireUnpaidAuctionWins } from "@/lib/orders";

// Vercel Cron (see vercel.json) invokes this hourly with
// `Authorization: Bearer ${CRON_SECRET}` when that env var is set on the
// project — the standard Vercel Cron auth pattern, so nothing but Vercel's
// own scheduler (or someone with the secret) can trigger this. Releasing
// stock is low-stakes to get wrong in either direction, but there's no
// reason to leave it open.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { expired } = await expireUnpaidAuctionWins();
  return NextResponse.json({ expired });
}
