import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { GemCard } from "@/components/catalog/GemCard";
import { Marquee } from "@/components/layout/Marquee";
import { Reveal, RevealGroup, RevealItem } from "@/components/layout/Reveal";
import { HeroSlideshow } from "@/components/layout/HeroSlideshow";

// Purpose-shot hero/banner photography (1905x855, full-bleed ready) —
// see public/images/ATTRIBUTION.md for sources and licensing.
const HERO_SLIDES = [
  { src: "/images/hero/03-sapphire-diamond-ring.jpg", alt: "Oval blue sapphire ring with diamond halo" },
  { src: "/images/hero/01-loose-ruby-crystals.jpg", alt: "Raw ruby crystals on a dark surface" },
  { src: "/images/hero/05-diamond-emerald-necklace.jpg", alt: "Diamond necklace with emerald floral pendant" },
  { src: "/images/hero/02-raw-emerald-crystal.jpg", alt: "Raw emerald crystal, macro shot" },
  { src: "/images/hero/04-gemstone-ring-on-hand.jpg", alt: "Pear-cut blue gemstone ring worn on hand" },
  { src: "/images/hero/06-loose-diamonds-arrangement.jpg", alt: "Loose round-cut diamonds arranged in a cluster" },
];

const MINERAL_MARQUEE = [
  "Blue Sapphire",
  "Padparadscha",
  "Ruby",
  "Alexandrite",
  "Cat's Eye Chrysoberyl",
  "Spinel",
  "Moonstone",
  "Zircon",
];

export default async function HomePage() {
  const featuredGems = await prisma.gemstone.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true, media: true },
  });

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
        <HeroSlideshow images={HERO_SLIDES} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(33,29,26,0.97) 0%, rgba(33,29,26,0.88) 32%, rgba(33,29,26,0.55) 58%, rgba(33,29,26,0.25) 100%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[120rem] px-5 pt-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">Ceylon Gemstones &amp; Fine Jewelry</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-ivory sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Colour, cut, and
              <br />
              provenance —
              <br />
              <span className="text-gold-soft">designed by you.</span>
            </h1>
            <p className="mt-7 max-w-md text-ivory/60">
              Explore ethically sourced Ceylon sapphires, rubies, and rare gems. Configure your own stone in real
              time, then request a private quote from our gemologists.
            </p>
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
            &ldquo;Every stone carries two thousand years of Ceylon&apos;s gem-bearing earth — we simply
            <span className="text-gold-soft"> reveal what was already there.</span>&rdquo;
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gold" />
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ivory/45">Ratnavue Gemological House</p>
        </Reveal>
      </section>

      {/* ---------- Heritage / Sourcing ---------- */}
      {/* Same treatment as the hero: full-bleed photo, dark-to-transparent
          scrim from the left, copy overlaid straight on the image — just
          static banners rather than a slideshow. Deliberately NOT forced to
          min-h-dvh/snap: two of these stacked run well past one viewport,
          and snapping the section's top to the viewport top used to cut the
          second banner off mid-image. */}
      <section className="bg-ivory-soft py-24 sm:py-32">
        <div className="mx-auto max-w-[120rem] space-y-8 px-5 sm:space-y-10 sm:px-8 lg:px-12 xl:px-16">
          <Reveal>
            <div className="relative flex h-[28rem] w-full items-center overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10 sm:h-[32rem] lg:h-[36rem]">
              <Image
                src="/images/heritage/ratnapura-sapphire-twin-crystal.jpg"
                alt="Raw sapphire twin crystal specimen from Ratnapura, Sri Lanka"
                fill
                className="object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.75) 32%, rgba(33,29,26,0.35) 60%, transparent 100%)",
                }}
              />
              <div className="relative max-w-md px-8 sm:px-12 lg:px-14">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Heritage</p>
                <h2 className="mt-3 font-serif text-3xl text-ivory sm:text-4xl">Two thousand years of Ceylon gems</h2>
                <p className="mt-4 leading-relaxed text-ivory/70">
                  Sri Lanka&apos;s gem gravels have produced some of history&apos;s most celebrated sapphires and
                  rubies for over two millennia. Ratnavue is built around that legacy — every gem is honestly
                  graded, and treatment status is always disclosed.
                </p>
                <LinkButton href="/about" variant="outline-light" className="mt-6">Read Our Story</LinkButton>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative flex h-[28rem] w-full items-center overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10 sm:h-[32rem] lg:h-[36rem]">
              <Image
                src="/images/heritage/sri-lanka-gem-trays.jpg"
                alt="Trays of loose faceted gemstones at a gem trading table in Sri Lanka"
                fill
                className="object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.75) 32%, rgba(33,29,26,0.35) 60%, transparent 100%)",
                }}
              />
              <div className="relative max-w-md px-8 sm:px-12 lg:px-14">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Sourcing</p>
                <h2 className="mt-3 font-serif text-3xl text-ivory sm:text-4xl">Can&apos;t find the exact stone?</h2>
                <p className="mt-4 leading-relaxed text-ivory/70">
                  Tell us what you&apos;re looking for and our sourcing team will search Sri Lanka&apos;s gem markets
                  on your behalf.
                </p>
                <LinkButton href="/sourcing" variant="outline-light" className="mt-6">Submit a Sourcing Request</LinkButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative flex min-h-dvh items-center overflow-hidden bg-charcoal py-28 text-center snap-start sm:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(50% 60% at 50% 100%, rgba(179,145,90,0.18), transparent 70%)" }}
        />
        <Reveal className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Design Your Gem</p>
          <h2 className="mt-4 font-serif text-4xl text-ivory sm:text-5xl">Begin with a colour in mind.</h2>
          <p className="mt-5 text-ivory/60">
            Mineral, cut, size, tone, and clarity — configured live, quoted privately.
          </p>
          <div className="mt-9">
            <LinkButton href="/configurator" variant="gold" size="lg">Open the Configurator</LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
