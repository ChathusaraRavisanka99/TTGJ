import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/layout/Reveal";
import { getPageContent, DEFAULT_ABOUT_CONTENT } from "@/lib/page-content";

export const metadata: Metadata = { title: "Our Story" };

export default async function AboutPage() {
  const content = await getPageContent("about", DEFAULT_ABOUT_CONTENT);

  const principles = [
    { n: "01", title: content.principle1Title, body: content.principle1Body },
    { n: "02", title: content.principle2Title, body: content.principle2Body },
    { n: "03", title: content.principle3Title, body: content.principle3Body },
  ];

  return (
    <div>
      {/* ---------- Page hero ---------- */}
      <section className="relative flex h-[26rem] w-full items-end overflow-hidden bg-charcoal sm:h-[30rem] lg:h-[34rem]">
        <Image src={content.heroImage} alt={content.heroHeading} fill priority className="object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(33,29,26,0.94) 0%, rgba(33,29,26,0.55) 45%, rgba(33,29,26,0.15) 75%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[120rem] px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12 xl:px-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">{content.heroKicker}</p>
            <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
              {content.heroHeading}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ---------- Intro: sticky label + wide column, not a centered block ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_2.2fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{content.introLabel}</p>
            <div className="mt-4 h-px w-12 bg-gold" />
          </Reveal>
          <Reveal delay={0.05} className="max-w-2xl">
            <p className="font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">{content.introLead}</p>
            <p className="mt-6 leading-relaxed text-charcoal/70">{content.introBody1}</p>
            <p className="mt-6 leading-relaxed text-charcoal/70">{content.introBody2}</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Asymmetric image break ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <Reveal className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end lg:gap-14">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
            <Image src={content.breakImage} alt={content.breakCaptionKicker} fill className="object-cover" />
          </div>
          <div className="lg:pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">{content.breakCaptionKicker}</p>
            <p className="mt-3 leading-relaxed text-charcoal/70">{content.breakCaptionBody}</p>
          </div>
        </Reveal>
      </section>

      {/* ---------- Pull quote ---------- */}
      <section className="my-20 border-y border-border-subtle bg-charcoal py-24 sm:my-28 sm:py-32">
        <Reveal className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="font-serif text-3xl leading-snug text-ivory sm:text-5xl">
            {content.quote} <span className="text-gold-soft">{content.quoteHighlight}</span>
          </p>
        </Reveal>
      </section>

      {/* ---------- Principles, spread across the full width ---------- */}
      <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-10 lg:gap-16">
          {principles.map((p, i) => (
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
          <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">{content.ctaHeading}</h2>
          <p className="mt-4 text-charcoal/70">{content.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/gems" variant="gold" size="lg">Shop Gemstones</LinkButton>
            <LinkButton href="/sourcing" variant="outline" size="lg">Submit a Sourcing Request</LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
