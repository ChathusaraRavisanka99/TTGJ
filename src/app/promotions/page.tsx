import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageVisibility } from "@/lib/page-visibility";
import { getSeasonalContent } from "@/lib/page-content";
import { getPromotionItems, promotionItemLabel } from "@/lib/promotion-items";
import { SEASONAL_THEMES } from "@/lib/seasonal-themes";
import { FallingParticles } from "@/components/seasonal/FallingParticles";
import { PromotionItemCard } from "@/components/promotions/PromotionItemCard";
import { LinkButton } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const visibility = await getPageVisibility("seasonal");
  if (visibility === "HIDDEN") return {};
  const content = await getSeasonalContent();
  const copy = content.themes[content.activeTheme];
  return { title: visibility === "COMING_SOON" ? "Coming Soon" : copy.heading };
}

export default async function PromotionsPage() {
  const visibility = await getPageVisibility("seasonal");
  // HIDDEN reads as though the route doesn't exist at all — no teaser,
  // no hint of what's coming, matching a page an admin hasn't touched yet.
  if (visibility === "HIDDEN") notFound();

  const content = await getSeasonalContent();
  const copy = content.themes[content.activeTheme];
  const theme = SEASONAL_THEMES[content.activeTheme] ?? SEASONAL_THEMES.autumn;
  const isComingSoon = visibility === "COMING_SOON";
  // Scoped to whichever theme is currently active — the same item can
  // sit in more than one theme's collection at once (see PromotionItem),
  // but a visitor only ever sees the one collection that matches what's
  // live right now.
  const items = isComingSoon ? [] : await getPromotionItems(content.activeTheme);

  return (
    <div>
      {/* min-h-dvh (not a fixed height) — fills exactly one screen on
          both desktop and mobile with the fixed Navbar overlapping its
          top edge, same full-bleed treatment as the homepage hero, but
          grows instead of clipping if an admin's own copy ever runs
          long on a short viewport. */}
      <div className={`relative flex min-h-dvh items-center justify-center overflow-hidden ${theme.backgroundClass}`}>
        <FallingParticles theme={theme} seed={theme.key.length} />

        {/* Halloween's "other stuff" — a static row of jack-o'-lanterns
            anchored along the bottom, distinct from the falling bats above:
            pumpkins don't fall, they sit and grin. */}
        {theme.key === "halloween" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-6 pb-4 text-4xl sm:gap-10 sm:text-6xl" aria-hidden>
            <span className="rotate-[-6deg]">🎃</span>
            <span className="translate-y-2">🎃</span>
            <span className="rotate-[8deg]">🎃</span>
            <span className="translate-y-1">🎃</span>
            <span className="rotate-[-4deg]">🎃</span>
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
          <p className={`text-xs uppercase tracking-[0.35em] ${theme.kickerClass}`}>
            {isComingSoon ? "Coming Soon" : copy.kicker}
          </p>
          <h1 className={`mt-4 font-serif text-4xl leading-tight sm:text-5xl ${theme.headingClass}`}>
            {isComingSoon ? "Something seasonal is on its way." : copy.heading}
          </h1>
          <p className={`mt-5 ${theme.bodyClass}`}>
            {isComingSoon ? "Check back soon for a limited-time collection." : copy.body}
          </p>
          {/* Always this theme's own collection, further down this same
              page — never a link an admin typed by hand — and only shown
              at all once there's actually something in it to jump to. */}
          {!isComingSoon && items.length > 0 && (
            <div className="mt-8">
              <LinkButton href="#collection" variant="gold" size="lg">
                {copy.ctaLabel}
              </LinkButton>
            </div>
          )}
          {isComingSoon && (
            <div className="mt-8">
              <Link href="/" className={`text-sm underline underline-offset-4 ${theme.bodyClass}`}>
                Back to Ratnavue
              </Link>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        // scroll-mt-24 keeps the heading clear of the fixed Navbar when
        // the hero's button jumps straight here.
        <div id="collection" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-charcoal/50">Promotional Collection</p>
          <h2 className="mt-3 font-serif text-3xl text-charcoal">Featured at a Special Price</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {items.map((item) => {
              const media = item.gemstone?.media ?? item.jewelry?.media ?? [];
              const product = item.gemstone ?? item.jewelry;
              const href = item.gemstone ? `/gems/${item.gemstone.slug}` : `/jewelry/${item.jewelry!.slug}`;
              const regularPrice = product?.showPrice ? product.price : null;
              return (
                <PromotionItemCard
                  key={item.id}
                  name={promotionItemLabel(item)}
                  href={href}
                  imageUrl={media[0]?.url}
                  promoPrice={item.promoPrice}
                  regularPrice={regularPrice}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
