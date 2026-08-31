import type { Metadata } from "next";
import { Reveal } from "@/components/layout/Reveal";

export const metadata: Metadata = { title: "Our Story" };

export default function AboutPage() {
  return (
    <div>
      <Reveal className="mx-auto max-w-3xl px-5 pt-8 pb-4 text-center sm:px-8 sm:pt-16">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Our Story</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-charcoal sm:text-6xl">
          From Ratnapura to your hands
        </h1>
        <div className="mx-auto mt-8 h-px w-16 bg-gold" />
      </Reveal>

      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <Reveal delay={0.05}>
          <p className="text-lg leading-relaxed text-charcoal/75">
            Sri Lanka — Ceylon — has yielded some of the world&apos;s finest gemstones for over two thousand years.
            The island&apos;s gem-bearing gravels, known locally as <em>illam</em>, have produced sapphires and
            rubies coveted by royal courts from Rome to the Mughal empire.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="my-14 border-y border-border-subtle py-10 text-center">
          <p className="font-serif text-3xl leading-snug text-charcoal sm:text-4xl">
            The stone should always come <span className="text-gold">first.</span>
          </p>
        </Reveal>

        <Reveal delay={0.05} className="space-y-6 leading-relaxed text-charcoal/75">
          <p>
            Ratnavue works directly with small-scale miners and cutters in Ratnapura and Elahera, Sri Lanka&apos;s
            historic gem-mining regions, to bring that heritage to a global audience — honestly graded, clearly
            disclosed, and cut to standards that respect each stone&apos;s natural character.
          </p>
          <p>
            Every gemstone we offer is disclosed for treatment status, and unheated stones are identified
            prominently. Where a customer wants something beyond our current stock, our sourcing team draws on
            decades of relationships in Sri Lanka&apos;s gem markets to find it.
          </p>
          <p>
            Our jewelry is designed and fabricated in small batches, built around the gemstone rather than the
            other way around.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
