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
      {/* `h-dvh`, not a fixed rem height: tracks the real visible viewport
          on mobile (see the homepage hero for the fuller iOS/Android
          rationale), and object-cover on the image below crops to whatever
          that resolved box ends up being — the "optimal crop for the box"
          part is just what object-cover already does once the box itself
          is sized correctly. The lg:max-h cap only exists for genuinely
          oversized desktop monitors — 1100px is well above ordinary laptop/
          desktop viewport heights (~900-1100px), which a lower cap here was
          clipping short, leaving bare background visible below the hero. */}
      <section className="relative flex h-dvh min-h-[520px] w-full items-center overflow-hidden bg-charcoal lg:max-h-[1100px]">
        <Image src={content.heroImage} alt={content.heroHeading} fill priority className="object-cover" />
        {/* Text moved from bottom-anchored to vertically centered, so the
            darkening now needs to hold up behind the middle of the image
            (wherever that lands) rather than just the bottom edge — a
            left-to-right scrim (strongest behind the text, clear toward the
            image's right side) reads correctly regardless of what's behind
            it vertically, which a bottom-weighted gradient no longer would. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.72) 38%, rgba(33,29,26,0.3) 68%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">{content.heroKicker}</p>
            <h1 className="mt-5 max-w-3xl font-serif text-6xl leading-[1.05] text-ivory sm:text-7xl lg:text-8xl">
              {content.heroHeading}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ---------- Intro ---------- */}
      {/* Still flush-left against the same edge as every section below it
          (that part of the earlier fix was right), but a single max-w-3xl
          column on a max-w-[120rem] canvas left the entire right half of
          the section empty on anything wider than a laptop — a lopsided
          amount of dead space next to a fairly short block of text. A
          two-column editorial split (lede left, supporting paragraphs
          right, both starting at the same left edge as their own column)
          uses that width instead of just leaving it bare. */}
      <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
        <Reveal className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{content.introLabel}</p>
            <div className="mt-4 h-px w-12 bg-gold" />
            <p className="mt-8 font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">{content.introLead}</p>
          </div>
          <div className="lg:pt-16">
            <p className="leading-relaxed text-charcoal/70">{content.introBody1}</p>
            <p className="mt-6 leading-relaxed text-charcoal/70">{content.introBody2}</p>
          </div>
        </Reveal>
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
      {/* min-h-dvh + items-center instead of a modest py-24 band: at a
          normal padding this section read as a squeezed strip rather than
          the deliberate, full-screen pause the line is meant to be (see the
          homepage's own editorial section, which already does this).
          Left-aligned like every other section on the page now, rather
          than the one centered exception. */}
      <section className="flex min-h-dvh items-center border-y border-border-subtle bg-charcoal py-24 sm:py-32">
        <Reveal className="mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <p className="max-w-4xl font-serif text-4xl leading-snug text-ivory sm:text-6xl lg:text-7xl">
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
