import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { GemCard } from "@/components/catalog/GemCard";
import { Gem3D } from "@/components/gem-visualizer/Gem3D";

export default async function HomePage() {
  const featuredGems = await prisma.gemstone.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true },
  });

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Ceylon Gemstones &amp; Fine Jewelry</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight text-charcoal sm:text-6xl">
            Colour, cut, and provenance — designed by you.
          </h1>
          <p className="mt-5 max-w-lg text-charcoal/70">
            Explore ethically sourced Ceylon sapphires, rubies, and rare gems. Configure your own stone in real time,
            then request a private quote from our gemologists.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton href="/configurator" variant="gold" size="lg">Design Your Gem</LinkButton>
            <LinkButton href="/gems" variant="outline" size="lg">Shop Gemstones</LinkButton>
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-b from-ivory-soft to-ivory p-10">
          <Gem3D
            cutSlug="oval"
            hue={228}
            darkness={38}
            claritySlug="eye-clean"
            caratWeight={3}
            seedKey="home-hero"
            className="mx-auto aspect-square w-full max-w-md"
          />
        </div>
      </section>

      {featuredGems.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Recently Added</p>
              <h2 className="mt-2 font-serif text-3xl text-charcoal">Featured Gemstones</h2>
            </div>
            <Link href="/gems" className="text-sm text-charcoal/70 underline hover:text-charcoal">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {featuredGems.map((gem) => (
              <GemCard
                key={gem.id}
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
              />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border-subtle bg-ivory-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Heritage</p>
            <h2 className="mt-2 font-serif text-3xl text-charcoal">Two thousand years of Ceylon gems</h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              Sri Lanka&apos;s gem gravels have produced some of history&apos;s most celebrated sapphires and rubies.
              We work directly with miners and cutters in Ratnapura to bring that legacy to you — honestly graded
              and clearly disclosed.
            </p>
            <LinkButton href="/about" variant="outline" className="mt-6">Read Our Story</LinkButton>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Sourcing</p>
            <h2 className="mt-2 font-serif text-3xl text-charcoal">Can&apos;t find the exact stone?</h2>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              Tell us what you&apos;re looking for and our sourcing team will search Sri Lanka&apos;s gem markets on
              your behalf.
            </p>
            <LinkButton href="/sourcing" variant="outline" className="mt-6">Submit a Sourcing Request</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
