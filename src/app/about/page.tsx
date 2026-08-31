import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/layout/Reveal";

export const metadata: Metadata = { title: "Our Story" };

const PRINCIPLES = [
  {
    n: "01",
    title: "Honest grading",
    body: "Every gemstone is graded on its own merits and described plainly — no inflated clarity claims, no vague colour names standing in for the real hue.",
  },
  {
    n: "02",
    title: "Treatment disclosed",
    body: "Heated, unheated, or otherwise — treatment status is stated on every listing, and unheated stones are identified prominently, not buried in fine print.",
  },
  {
    n: "03",
    title: "Stone-first design",
    body: "Jewelry here is designed around the gemstone rather than the other way around — the setting exists to let the stone speak, not to compete with it.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* ---------- Page hero ---------- */}
      <section className="relative flex h-[26rem] w-full items-end overflow-hidden bg-charcoal sm:h-[30rem] lg:h-[34rem]">
        <Image
          src="/images/hero/02-raw-emerald-crystal.jpg"
          alt="Macro shot of a raw emerald crystal"
          fill
          priority
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(33,29,26,0.94) 0%, rgba(33,29,26,0.55) 45%, rgba(33,29,26,0.15) 75%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[120rem] px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12 xl:px-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">Our Story</p>
            <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
              A colour-first approach to Ceylon gems
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ---------- Intro: sticky label + wide column, not a centered block ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_2.2fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">The Island</p>
            <div className="mt-4 h-px w-12 bg-gold" />
          </Reveal>
          <Reveal delay={0.05} className="max-w-2xl">
            <p className="font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">
              Sri Lanka — Ceylon — has yielded some of the world&apos;s finest gemstones for over two thousand
              years.
            </p>
            <p className="mt-6 leading-relaxed text-charcoal/70">
              The island&apos;s gem-bearing gravels, known locally as <em>illam</em>, have produced sapphires and
              rubies coveted by royal courts from Rome to the Mughal empire. That legacy is still being pulled from
              the earth today, stone by stone, largely by hand.
            </p>
            <p className="mt-6 leading-relaxed text-charcoal/70">
              Ratnavue is built around that heritage: every gemstone is meant to be honestly graded and clearly
              disclosed, cut to standards that respect its natural character rather than force it into a trend.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Asymmetric image break ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <Reveal className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end lg:gap-14">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
            <Image
              src="/images/heritage/ratnapura-sapphire-twin-crystal.jpg"
              alt="A raw sapphire twin crystal from Ratnapura, Sri Lanka, before cutting"
              fill
              className="object-cover"
            />
          </div>
          <div className="lg:pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Rough to reveal</p>
            <p className="mt-3 leading-relaxed text-charcoal/70">
              A raw sapphire crystal, as it comes out of the earth — every facet still to be discovered by the
              cutter&apos;s hand.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------- Pull quote ---------- */}
      <section className="my-20 border-y border-border-subtle bg-charcoal py-24 sm:my-28 sm:py-32">
        <Reveal className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="font-serif text-3xl leading-snug text-ivory sm:text-5xl">
            The stone should always come <span className="text-gold-soft">first.</span>
          </p>
        </Reveal>
      </section>

      {/* ---------- Principles, spread across the full width ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-10 lg:gap-16">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <span className="font-serif text-5xl text-gold/25 sm:text-6xl">{p.n}</span>
              <h2 className="mt-3 font-serif text-2xl text-charcoal">{p.title}</h2>
              <p className="mt-3 leading-relaxed text-charcoal/70">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="border-t border-border-subtle bg-ivory-soft py-20 text-center sm:py-28">
        <Reveal className="mx-auto max-w-xl px-5 sm:px-8">
          <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">See it for yourself.</h2>
          <p className="mt-4 text-charcoal/70">
            Browse the current collection, or tell us what you&apos;re looking for and our sourcing team will go
            find it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/gems" variant="gold" size="lg">Shop Gemstones</LinkButton>
            <LinkButton href="/sourcing" variant="outline" size="lg">Submit a Sourcing Request</LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
