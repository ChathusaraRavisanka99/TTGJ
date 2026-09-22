import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarket, withMarket } from "@/lib/market";
import { BIZ_INVITE_COOKIE } from "@/lib/business";

const BIZ_INVITE_MAX_AGE_DAYS = 30;

// A team owner's invite link (BusinessAccount.id doubles as the token —
// see lib/business.ts). Already signed in: attach immediately (if not
// already on a team) and go straight to the business hub. Not signed in:
// stage the invite in a cookie and send them to register — both sign-up
// paths read it back the same way a referral code is (see
// captureBusinessInvite, registerCustomer, and lib/auth.ts's
// events.createUser).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getMarket();

  const business = await prisma.businessAccount.findUnique({ where: { id } });
  if (!business) return NextResponse.redirect(new URL(withMarket("/", market), req.url));

  const session = await auth();
  if (session?.user) {
    await prisma.user.updateMany({
      where: { id: session.user.id, businessAccountId: null },
      data: { businessAccountId: id, businessRole: "MEMBER" },
    });
    return NextResponse.redirect(new URL(withMarket("/account/business", market), req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(BIZ_INVITE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: BIZ_INVITE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return NextResponse.redirect(new URL(withMarket("/account/register", market), req.url));
}
