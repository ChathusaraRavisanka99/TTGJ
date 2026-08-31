import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getPageContent, DEFAULT_HOME_CONTENT } from "@/lib/page-content";
import { LinkButton } from "@/components/ui/Button";
import { GemCard } from "@/components/catalog/GemCard";
import { GemVisualizer } from "@/components/gem-visualizer/GemVisualizer";
import { Marquee } from "@/components/layout/Marquee";
import { Reveal, RevealGroup, RevealItem } from "@/components/layout/Reveal";
import { HeroSlideshow } from "@/components/layout/HeroSlideshow";

const MINERAL_MARQUEE = [
  { label: "Blue Sapphire", color: "#3a5f9e" },
  { label: "Padparadscha", color: "#e08a5c" },
  { label: "Ruby", color: "#a4283f" },
  { label: "Alexandrite", color: "#4a7c5d" },
  { label: "Cat's Eye Chrysoberyl", color: "#b8934a" },
  { label: "Spinel", color: "#c05a82" },
  { label: "Moonstone", color: "#9fb8cc" },
  { label: "Zircon", color: "#5a9bc4" },
];

export default async function HomePage() {
  const [featuredGems, content] = await Promise.all([
    prisma.gemstone.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true, media: true },
    }),
    getPageContent("home", DEFAULT_HOME_CONTENT),
  ]);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      {/*
        `h-dvh`, not `h-screen`: on iOS/Android, 100vh is sized against the
        largest possible viewport (as if browser chrome were hidden), not
        the viewport actually visible on load — so a `100vh` hero either
        shows a sliver of the next section under the address bar, or looks
        short once the chrome collapses. `dvh` tracks the real, current
        viewport instead. The `920px` cap only kicks in at `lg`+ (desktop) —
        it exists purely to stop the hero ballooning on ultra-tall desktop
        monitors, and was clipping the hero short on tablets like iPad Mini
        (portrait ~1024px tall) before it was scoped.
      */}
      <section className="relative flex h-dvh min-h-[720px] w-full snap-start items-center overflow-hidden bg-charcoal lg:max-h-[920px]">
        <HeroSlideshow images={content.heroSlides} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(33,29,26,0.97) 0%, rgba(33,29,26,0.88) 32%, rgba(33,29,26,0.55) 58%, rgba(33,29,26,0.25) 100%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[120rem] px-5 pt-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">{content.heroKicker}</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-ivory sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              {content.heroHeadingLine1}
              <br />
              {content.heroHeadingLine2}
              <br />
              <span className="text-gold-soft">{content.heroHeadingHighlight}</span>
            </h1>
            <p className="mt-7 max-w-md text-ivory/60">{content.heroSubtext}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <LinkButton href="/configurator" variant="gold" size="lg">Design Your Gem</LinkButton>
              <LinkButton href="/gems" variant="outline-light" size="lg">Shop Gemstones</LinkButton>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-ivory/50">
          <span className="text-[10px] uppercase tracking-[0.35em]">Scroll</span>
          <div className="h-9 w-px bg-ivory/30" />
          <div className="animate-scroll-cue h-1.5 w-1.5 rounded-full bg-gold" />
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <div className="border-y border-border-subtle bg-ivory-soft py-5 text-charcoal">
        <Marquee items={MINERAL_MARQUEE} />
      </div>

      {/* ---------- Featured ---------- */}
      {featuredGems.length > 0 && (
        <section className="mx-auto flex min-h-dvh w-full max-w-[120rem] snap-start flex-col justify-center px-5 py-24 sm:px-8 sm:py-32 lg:px-12 xl:px-16">
          <Reveal className="mb-14 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Recently Added</p>
              <h2 className="mt-3 font-serif text-4xl text-charcoal sm:text-5xl">Featured Gemstones</h2>
            </div>
            <Link href="/gems" className="hidden text-sm text-charcoal/70 underline decoration-charcoal/30 underline-offset-4 hover:text-charcoal sm:block">
              View all
            </Link>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {featuredGems.map((gem) => (
              <RevealItem key={gem.id}>
                <GemCard
                  slug={gem.slug}
                  name={gem.name}
                  mineralName={gem.mineral.name}
                  cutSlug={gem.cut.slug}
                  cutName={gem.cut.name}
                  caratWeight={gem.caratWeight}
                  colorHue={gem.colorHue}
                  colorLightness={gem.colorLightness}
                  claritySlug={gem.clarityGrade.slug}
                  clarityName={gem.clarityGrade.name}
                  treatmentName={gem.treatment.name}
                  isCeylon={gem.origin.isCeylon}
                  stockStatus={gem.stockStatus}
                  primaryImageUrl={gem.media.find((m) => m.isPrimary)?.url ?? gem.media[0]?.url}
                  price={gem.price}
                  showPrice={gem.showPrice}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ---------- Editorial statement ---------- */}
      <section className="flex min-h-dvh items-center border-y border-border-subtle bg-charcoal py-28 snap-start sm:py-36">
        <Reveal className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="font-serif text-3xl leading-snug text-ivory sm:text-5xl">
            &ldquo;{content.editorialQuote} <span className="text-gold-soft">{content.editorialQuoteHighlight}</span>&rdquo;
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gold" />
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ivory/45">{content.editorialAttribution}</p>
        </Reveal>
      </section>

      {/* ---------- Heritage / Sourcing ---------- */}
      {/* Same treatment as the hero: full-bleed photo, dark-to-transparent
          scrim from the left, copy overlaid straight on the image — just
          static banners rather than a slideshow. Side by side at lg+ (one
          grid row, so both banners stay the same height); stacked below
          that. Deliberately NOT forced to min-h-dvh/snap: even stacked,
          the pair runs well past one viewport, and snapping the section's
          top to the viewport top used to cut the second banner off
          mid-image. */}
      <section className="bg-ivory-soft py-24 sm:py-32">
        <div className="mx-auto grid max-w-[120rem] gap-8 px-5 sm:gap-10 sm:px-8 lg:grid-cols-2 lg:px-12 xl:px-16">
          <Reveal>
            <div className="relative flex h-[28rem] w-full items-center overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10 sm:h-[32rem] lg:h-[30rem]">
              <Image src={content.heritageImage} alt={content.heritageHeading} fill className="object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.75) 32%, rgba(33,29,26,0.35) 60%, transparent 100%)",
                }}
              />
              <div className="relative max-w-md px-8 sm:px-12 lg:px-14">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">{content.heritageKicker}</p>
                <h2 className="mt-3 font-serif text-3xl text-ivory sm:text-4xl">{content.heritageHeading}</h2>
                <p className="mt-4 leading-relaxed text-ivory/70">{content.heritageBody}</p>
                <LinkButton href="/about" variant="outline-light" className="mt-6">Read Our Story</LinkButton>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative flex h-[28rem] w-full items-center overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10 sm:h-[32rem] lg:h-[30rem]">
              <Image src={content.sourcingImage} alt={content.sourcingHeading} fill className="object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.75) 32%, rgba(33,29,26,0.35) 60%, transparent 100%)",
                }}
              />
              <div className="relative max-w-md px-8 sm:px-12 lg:px-14">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">{content.sourcingKicker}</p>
                <h2 className="mt-3 font-serif text-3xl text-ivory sm:text-4xl">{content.sourcingHeading}</h2>
                <p className="mt-4 leading-relaxed text-ivory/70">{content.sourcingBody}</p>
                <LinkButton href="/sourcing" variant="outline-light" className="mt-6">Submit a Sourcing Request</LinkButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative flex min-h-dvh items-center overflow-hidden bg-charcoal py-28 snap-start sm:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(50% 60% at 50% 100%, rgba(179,145,90,0.18), transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-4xl items-center gap-10 px-5 text-center sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:text-left">
          <Reveal className="order-2 lg:order-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">{content.closingKicker}</p>
            <h2 className="mt-4 font-serif text-4xl text-ivory sm:text-5xl">{content.closingHeading}</h2>
            <p className="mt-5 text-ivory/60">{content.closingBody}</p>
            <div className="mt-9">
              <LinkButton href="/configurator" variant="gold" size="lg">Open the Configurator</LinkButton>
            </div>
          </Reveal>
          {/* A small showcase of the visualizer itself — the same procedural
              renderer used across the catalog and configurator, now with
              real per-facet shading (see gem-visualizer commit) rather than
              the flat "flower" look it used to have. */}
          <Reveal delay={0.1} className="order-1 mx-auto w-44 sm:w-56 lg:order-2 lg:w-64">
            <GemVisualizer
              cutSlug="round-brilliant"
              hue={221}
              darkness={42}
              claritySlug="loupe-clean"
              caratWeight={2.5}
              seedKey="closing-cta-showcase"
              className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
