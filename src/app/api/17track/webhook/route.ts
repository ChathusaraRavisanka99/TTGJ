import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderDelivered } from "@/lib/orders";
import { parseTrack17Webhook } from "@/lib/track17";

// 17track's webhook push, registered against the tracking numbers
// lib/track17.ts's registerTracking() submits. Gated by a shared-secret
// query param (?secret=...) we choose and set both here (TRACK17_WEBHOOK_SECRET)
// and as part of the Push URL configured in 17track's dashboard — not a
// request-signature check, since 17track's exact signing scheme wasn't
// something I could confirm against live docs/a real account in this
// environment, and a shared secret we fully control is the more honest
// guardrail to ship rather than an unverified signature algorithm. The
// blast radius of a forged call is low regardless: it can only advance an
// order from SHIPPED to DELIVERED (see markOrderDelivered), never touch
// payment or reveal anything.
export async function POST(req: Request) {
  const secret = process.env.TRACK17_WEBHOOK_SECRET;
  const providedSecret = new URL(req.url).searchParams.get("secret");
  if (!secret || providedSecret !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const event = parseTrack17Webhook(payload);
  if (!event) return new NextResponse("OK", { status: 200 });

  const order = await prisma.order.findFirst({ where: { trackingNumber: event.trackingNumber, status: "SHIPPED" } });
  if (!order) return new NextResponse("OK", { status: 200 });

  if (event.delivered) {
    await markOrderDelivered(order.id, { source: "17track" });
  }

  return new NextResponse("OK", { status: 200 });
}
