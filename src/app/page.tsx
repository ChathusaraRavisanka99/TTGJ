import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { GemCard } from "@/components/catalog/GemCard";
import { Marquee } from "@/components/layout/Marquee";
import { Reveal, RevealGroup, RevealItem } from "@/components/layout/Reveal";
import { HeroSlideshow } from "@/components/layout/HeroSlideshow";

const HERO_SLIDES = [
  { src: "/images/jewelry/sapphire-ring.jpg", alt: "Oval Ceylon blue sapphire ring in 18K gold" },
  { src: "/images/gems/padparadscha-sapphire.jpg", alt: "Padparadscha sapphire, cushion cut" },
  { src: "/images/gems/alexandrite.jpg", alt: "Colour-change alexandrite" },
  { src: "/images/gems/cats-eye-chrysoberyl.jpg", alt: "Cat's eye chrysoberyl cabochon" },
  { src: "/images/gems/ruby.jpg", alt: "Faceted ruby" },
  { src: "/images/gems/blue-sapphire.jpg", alt: "Cornflower blue sapphire" },
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
      <section className="relative flex h-screen min-h-[720px] w-full items-center overflow-hidden bg-charcoal">
        <HeroSlideshow images={HERO_SLIDES} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(33,29,26,0.97) 0%, rgba(33,29,26,0.88) 32%, rgba(33,29,26,0.55) 58%, rgba(33,29,26,0.25) 100%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">Ceylon Gemstones &amp; Fine Jewelry</p>
            <h1 className="mt-5 font-serif text-6xl leading-[1.05] text-ivory sm:text-7xl lg:text-[5.5rem]">
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
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
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
      <section className="border-y border-border-subtle bg-charcoal py-28 sm:py-36">
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
      <section className="bg-ivory-soft">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 sm:py-32 md:grid-cols-2">
          <Reveal>
            <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-charcoal">
              <Image
                src="/images/heritage/ratnapura-gem-mine.jpg"
                alt="Raw sapphire crystal from Sri Lanka's gem-bearing gravels"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Heritage</p>
            <h2 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">Two thousand years of Ceylon gems</h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              Sri Lanka&apos;s gem gravels have produced some of history&apos;s most celebrated sapphires and rubies
              for over two millennia. Ratnavue is built around that legacy — every gem is honestly graded, and
              treatment status is always disclosed.
            </p>
            <LinkButton href="/about" variant="outline" className="mt-6">Read Our Story</LinkButton>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mb-6 aspect-[4/3] rounded-2xl bg-gradient-to-br from-gold via-gold-soft to-ivory-soft" />
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Sourcing</p>
            <h2 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">Can&apos;t find the exact stone?</h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              Tell us what you&apos;re looking for and our sourcing team will search Sri Lanka&apos;s gem markets on
              your behalf.
            </p>
            <LinkButton href="/sourcing" variant="outline" className="mt-6">Submit a Sourcing Request</LinkButton>
          </Reveal>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative overflow-hidden bg-charcoal py-28 text-center sm:py-36">
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
