import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getJewelryBySlug } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { getActivePromotion } from "@/lib/promotion-items";
import { StockBadge } from "@/components/ui/Badge";
import { QuoteRequestPanel } from "@/components/quote/QuoteRequestPanel";
import { MediaGallery } from "@/components/catalog/MediaGallery";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/layout/Reveal";

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

  const promotion = await getActivePromotion({ jewelryId: piece.id });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal y={16}>
          <MediaGallery media={piece.media} fallbackLabel={piece.name} />
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-gold">
              {piece.pieceType.charAt(0) + piece.pieceType.slice(1).toLowerCase()}
            </p>
            <StockBadge status={piece.stockStatus} />
          </div>
          <h1 className="mt-2 font-serif text-4xl text-charcoal">{piece.name}</h1>
          <ProductPrice price={piece.price} showPrice={piece.showPrice} retailPrice={piece.retailPrice} promotion={promotion} />
          {piece.description && <p className="mt-4 leading-relaxed text-charcoal/70">{piece.description}</p>}

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
        </Reveal>
      </div>
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
