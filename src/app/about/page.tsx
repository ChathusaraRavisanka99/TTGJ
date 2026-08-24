import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Story" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Our Story</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">From Ratnapura to your hands</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-charcoal/75">
        <p>
          Sri Lanka — Ceylon — has yielded some of the world&apos;s finest gemstones for over two thousand years.
          The island&apos;s gem-bearing gravels, known locally as <em>illam</em>, have produced sapphires and rubies
          coveted by royal courts from Rome to the Mughal empire.
        </p>
        <p>
          Ratnavue works directly with small-scale miners and cutters in Ratnapura and Elahera, Sri Lanka&apos;s
          historic gem-mining regions, to bring that heritage to a global audience — honestly graded, clearly
          disclosed, and cut to standards that respect each stone&apos;s natural character.
        </p>
        <p>
          Every gemstone we offer is disclosed for treatment status, and unheated stones are identified prominently.
          Where a customer wants something beyond our current stock, our sourcing team draws on decades of
          relationships in Sri Lanka&apos;s gem markets to find it.
        </p>
        <p>
          Our jewelry is designed and fabricated in small batches, built around the gemstone rather than the other
          way around — because in our view, the stone should always come first.
        </p>
      </div>
    </div>
  );
}
