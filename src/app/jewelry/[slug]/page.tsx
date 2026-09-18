import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getJewelryBySlug, getRelatedJewelry } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { getActivePromotion, getActivePromotionMaps } from "@/lib/promotion-items";
import { StockBadge } from "@/components/ui/Badge";
import { QuoteRequestPanel } from "@/components/quote/QuoteRequestPanel";
import { MediaGallery } from "@/components/catalog/MediaGallery";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { JewelryCard } from "@/components/catalog/JewelryCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/layout/Reveal";
import { TrustBar } from "@/components/layout/TrustBar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CardSlider } from "@/components/ui/CardSlider";
import { HeritageSideArt } from "@/components/catalog/HeritageSideArt";
import { StickyBuyBar } from "@/components/catalog/StickyBuyBar";
import { getTrustBarMessages } from "@/lib/i18n-messages";
import { formatPrice } from "@/lib/utils";

const METAL_LABELS: Record<string, string> = {
  GOLD: "Gold",
  WHITE_GOLD: "White Gold",
  ROSE_GOLD: "Rose Gold",
  PLATINUM: "Platinum",
  SILVER: "Silver",
};

export async function generateMetadata({ params }: PageProps<"/jewelry/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const piece = await getJewelryBySlug(slug);
  if (!piece) return {};
  return { title: piece.name, description: piece.description ?? undefined };
}

export default async function JewelryDetailPage({ params }: PageProps<"/jewelry/[slug]">) {
  const { slug } = await params;
  const [piece, session] = await Promise.all([getJewelryBySlug(slug), auth()]);

  if (!piece || !piece.isPublished) notFound();

  const [promotion, relatedJewelry, { jewelryPrices }, trustBarMessages] = await Promise.all([
    getActivePromotion({ jewelryId: piece.id }),
    getRelatedJewelry(piece),
    getActivePromotionMaps(),
    getTrustBarMessages(),
  ]);

  const pieceTypeLabel = piece.pieceType.charAt(0) + piece.pieceType.slice(1).toLowerCase();
  // Same price precedence CardPrice/ProductPrice use for display — see
  // StickyBuyBar's own comment for why this is a plain label.
  const displayPrice = promotion?.promoPrice ?? piece.retailPrice ?? (piece.showPrice ? piece.price : null);
  const stickyPriceLabel = displayPrice != null ? formatPrice(displayPrice) : "Request a Quote";

  return (
    <div className="relative overflow-hidden">
      <HeritageSideArt side="left" className="absolute left-0 top-0 h-full w-48" />
      <HeritageSideArt side="right" className="absolute right-0 top-0 h-full w-48" />
      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jewelry", href: "/jewelry" },
          { label: pieceTypeLabel, href: `/jewelry?pieceType=${piece.pieceType}` },
          { label: piece.name },
        ]}
      />
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal y={16}>
          <MediaGallery media={piece.media} fallbackLabel={piece.name} />
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-gold">{pieceTypeLabel}</p>
            <StockBadge status={piece.stockStatus} />
          </div>
          <h1 className="mt-2 font-serif text-4xl text-charcoal">{piece.name}</h1>
          <ProductPrice price={piece.price} showPrice={piece.showPrice} retailPrice={piece.retailPrice} promotion={promotion} />
          {piece.description && <p className="mt-4 leading-relaxed text-charcoal/70">{piece.description}</p>}

          {/* Same honest "won't be restocked" reasoning as the gem detail
              page — JewelryPiece rows have no quantity field either. */}
          {piece.stockStatus === "AVAILABLE" && (
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gold">
              <Sparkles size={13} /> One piece, handcrafted — once it sells, it won&apos;t be made again.
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border-subtle py-6">
            <Spec label="Metal" value={METAL_LABELS[piece.metalType]} />
            {piece.metalPurity && <Spec label="Purity" value={piece.metalPurity} />}
            {piece.metalWeightG && <Spec label="Metal Weight" value={`${piece.metalWeightG} g`} />}
            {piece.ringSize && <Spec label="Ring Size" value={piece.ringSize} />}
            {piece.styleTags.length > 0 && <Spec label="Style" value={piece.styleTags.join(", ")} />}
          </dl>

          {piece.gemstones.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-charcoal/45">Gemstones Set In This Piece</p>
              <ul className="mt-2 space-y-1">
                {piece.gemstones.map((link) => (
                  <li key={link.id} className="text-sm text-charcoal/75">
                    {link.gemstone ? (
                      <Link href={`/gems/${link.gemstone.slug}`} className="underline hover:text-charcoal">
                        {link.gemstone.name}
                      </Link>
                    ) : (
                      link.freeformDesc
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div id="buy-box">
            {piece.retailPrice != null && (
              <div className="mt-8">
                {session?.user ? (
                  <AddToCartButton jewelryId={piece.id} />
                ) : (
                  <div>
                    <p className="text-sm text-charcoal/75">Sign in to add {piece.name} to your cart at the retail price.</p>
                    <Link href={`/account/login?callbackUrl=${encodeURIComponent(`/jewelry/${piece.slug}`)}`}>
                      <Button variant="primary" className="mt-3">Sign in to add to cart</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8">
              <QuoteRequestPanel isAuthenticated={!!session?.user} jewelryId={piece.id} productLabel={piece.name} />
            </div>
          </div>

          <TrustBar messages={trustBarMessages} variant="compact" className="mt-8 border-t border-border-subtle pt-6" />
        </Reveal>
      </div>

      {relatedJewelry.length > 0 && (
        <Reveal className="mt-20 border-t border-border-subtle pt-14 sm:mt-28 sm:pt-16">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">More From the Collection</p>
          <h2 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">You May Also Love</h2>
          <div className="mt-8">
            <CardSlider>
              {relatedJewelry.map((related) => (
                <div key={related.id} className="w-[calc(50%-12px)] shrink-0 snap-start sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]">
                  <JewelryCard
                    slug={related.slug}
                    name={related.name}
                    pieceType={related.pieceType}
                    metalType={related.metalType}
                    stockStatus={related.stockStatus}
                    primaryImageUrl={related.media.find((m) => m.isPrimary)?.url ?? related.media[0]?.url}
                    price={related.price}
                    showPrice={related.showPrice}
                    retailPrice={related.retailPrice}
                    promoPrice={jewelryPrices.get(related.id)}
                  />
                </div>
              ))}
            </CardSlider>
          </div>
        </Reveal>
      )}
      </div>
      <StickyBuyBar name={piece.name} priceLabel={stickyPriceLabel} />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-charcoal/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-charcoal">{value}</dd>
    </div>
  );
}
