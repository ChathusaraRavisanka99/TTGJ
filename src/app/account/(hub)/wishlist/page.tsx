import type { Metadata } from "next";
import Link from "@/components/ui/MarketLink";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarket } from "@/lib/market";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { GemResults } from "@/components/catalog/GemResults";
import { JewelryResults } from "@/components/catalog/JewelryResults";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const market = await getMarket();
  const [items, promotions] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        gemstone: { include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true, media: true } },
        jewelry: { include: { media: { orderBy: { sortOrder: "asc" } } } },
      },
    }),
    getActivePromotionMaps(market),
  ]);

  // A saved item can later be unpublished, sold out of the admin's mind
  // entirely (hard-deleted), or belong to the *other* store — filtered out
  // here rather than shown broken; the row itself is left alone (no
  // cleanup action needed) since it'll simply reappear if the item comes
  // back.
  const gems = items
    .map((i) => i.gemstone)
    .filter((g): g is NonNullable<typeof g> => !!g && g.isPublished && g.market === market);
  const pieces = items
    .map((i) => i.jewelry)
    .filter((p): p is NonNullable<typeof p> => !!p && p.isPublished && p.market === market);

  const wishlistedIds = new Set([...gems.map((g) => g.id), ...pieces.map((p) => p.id)]);

  return (
    <div className="w-full">
      <p className="text-xs uppercase tracking-widest text-gold-deep">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">My Wishlist</h1>

      {gems.length === 0 && pieces.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-8 text-center">
          <p className="text-charcoal/60">Nothing saved yet — tap the heart on any gemstone or piece to keep it here.</p>
          <LinkButton href="/gems" variant="primary" className="mt-4">Browse Gemstones</LinkButton>
        </div>
      ) : (
        <div className="mt-8 space-y-16">
          {gems.length > 0 && (
            <section>
              <h2 className="mb-6 font-serif text-2xl text-charcoal">Gemstones</h2>
              <GemResults
                gems={gems.map((gem) => ({ ...gem, promoPrice: promotions.gemstonePrices.get(gem.id) ?? null }))}
                wishlistedIds={wishlistedIds}
                isAuthenticated
              />
            </section>
          )}
          {pieces.length > 0 && (
            <section>
              <h2 className="mb-6 font-serif text-2xl text-charcoal">Jewelry</h2>
              <JewelryResults
                pieces={pieces.map((piece) => ({ ...piece, promoPrice: promotions.jewelryPrices.get(piece.id) ?? null }))}
                wishlistedIds={wishlistedIds}
                isAuthenticated
              />
            </section>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-charcoal/65">
        <Link href="/account" className="underline hover:text-charcoal">Back to My Account</Link>
      </p>
    </div>
  );
}
