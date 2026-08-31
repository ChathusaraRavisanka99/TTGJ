import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/layout/Reveal";

export const metadata: Metadata = { title: "Our Story" };

export default function AboutPage() {
  return (
    <div>
      <Reveal className="mx-auto max-w-3xl px-5 pt-8 pb-4 text-center sm:px-8 sm:pt-16">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Our Story</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-charcoal sm:text-6xl">
          A colour-first approach to Ceylon gems
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

        <Reveal delay={0.1} className="relative my-14 aspect-[16/10] overflow-hidden rounded-2xl bg-charcoal">
          <Image
            src="/images/heritage/ratnapura-gem-mine.jpg"
            alt="A raw sapphire crystal from Sri Lanka's gem-bearing gravels, before cutting"
            fill
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 to-transparent p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-ivory/80">Rough to reveal</p>
            <p className="mt-1 text-sm text-ivory/60">A raw sapphire crystal, as it comes out of the earth.</p>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="my-14 border-y border-border-subtle py-10 text-center">
          <p className="font-serif text-3xl leading-snug text-charcoal sm:text-4xl">
            The stone should always come <span className="text-gold">first.</span>
          </p>
        </Reveal>

        <Reveal delay={0.05} className="space-y-6 leading-relaxed text-charcoal/75">
          <p>
            Ratnavue is built around that heritage: every gemstone is meant to be honestly graded and clearly
            disclosed, cut to standards that respect its natural character rather than force it into a trend.
          </p>
          <p>
            Treatment status is disclosed on every listing, and unheated stones are identified prominently. Where
            a customer wants something beyond current stock, a sourcing request lets us go looking for it.
          </p>
          <p>
            Jewelry here is designed around the gemstone rather than the other way around — the setting exists to
            let the stone speak.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
