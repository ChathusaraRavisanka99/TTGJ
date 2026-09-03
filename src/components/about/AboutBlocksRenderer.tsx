import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "@/components/layout/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AboutBlock, AboutRow, ColumnSpan, SpacerHeight } from "@/lib/about-blocks";

// The single source of truth for how About-page rows/blocks render —
// shared by the real /about page (server-rendered from saved content) and
// the admin builder's live-preview pane (client-rendered from in-progress,
// unsaved edits). Keeping one renderer for both means the preview can
// never drift from what actually ships.
//
// A row with one full-width (span 12) column renders its block exactly as
// a standalone section — full-bleed for hero/quote, self-contained boxed
// sections for the rest, same as before rows/columns existed. A row with
// 2+ columns instead renders them side-by-side inside one shared
// contained wrapper, using each block's more compact "boxed" rendering
// (see the Boxed* components) so it fits whatever width its column ends
// up with.
//
// `animate=false` (used by the admin preview pane) swaps Reveal's
// scroll-triggered fade-in for a plain div: the preview pane is a small,
// independently-scrolled box, and whileInView's viewport intersection
// math is tuned for the real full-height page, not a cropped sidebar —
// plain, immediately-visible content reads correctly there instead of
// intermittently stuck at opacity 0.

function Wrap({ animate, className, delay, children }: { animate: boolean; className?: string; delay?: number; children: ReactNode }) {
  if (!animate) return <div className={className}>{children}</div>;
  return <Reveal className={className} delay={delay}>{children}</Reveal>;
}

// Literal class names (not template-interpolated) so Tailwind's static
// scan always finds them regardless of which spans are actually in use.
const SPAN_CLASSES: Record<ColumnSpan, string> = {
  1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4",
  5: "sm:col-span-5", 6: "sm:col-span-6", 7: "sm:col-span-7", 8: "sm:col-span-8",
  9: "sm:col-span-9", 10: "sm:col-span-10", 11: "sm:col-span-11", 12: "sm:col-span-12",
};

// ---------- Full section renderings (solo full-width rows) ----------

function HeroSection({ block, animate }: { block: Extract<AboutBlock, { type: "hero" }>; animate: boolean }) {
  return (
    <section className="relative flex h-dvh min-h-[520px] w-full items-center overflow-hidden bg-charcoal lg:max-h-[1100px]">
      {block.image && <Image src={block.image} alt={block.heading} fill priority className="object-cover" />}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(33,29,26,0.92) 0%, rgba(33,29,26,0.72) 38%, rgba(33,29,26,0.3) 68%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <Wrap animate={animate}>
          <p className="text-xs uppercase tracking-[0.35em] text-gold-soft">{block.kicker}</p>
          <h1 className="mt-5 max-w-3xl font-serif text-6xl leading-[1.05] text-ivory sm:text-7xl lg:text-8xl">
            {block.heading}
          </h1>
        </Wrap>
      </div>
    </section>
  );
}

function TextSection({ block, animate }: { block: Extract<AboutBlock, { type: "text" }>; animate: boolean }) {
  return (
    <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
      <Wrap animate={animate} className="grid gap-10 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{block.label}</p>
          <div className="mt-4 h-px w-12 bg-gold" />
          <p className="mt-8 font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">{block.lead}</p>
        </div>
        <div className="lg:pt-16">
          <p className="leading-relaxed text-charcoal/70">{block.body1}</p>
          <p className="mt-6 leading-relaxed text-charcoal/70">{block.body2}</p>
        </div>
      </Wrap>
    </section>
  );
}

function ImageCaptionSection({ block, animate }: { block: Extract<AboutBlock, { type: "imageCaption" }>; animate: boolean }) {
  return (
    <section className="mx-auto max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
      <Wrap animate={animate} className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end lg:gap-14">
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
          {block.image && <Image src={block.image} alt={block.kicker} fill className="object-cover" />}
        </div>
        <div className="lg:pb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">{block.kicker}</p>
          <p className="mt-3 leading-relaxed text-charcoal/70">{block.body}</p>
        </div>
      </Wrap>
    </section>
  );
}

function ImageBlockSection({ block, animate }: { block: Extract<AboutBlock, { type: "image" }>; animate: boolean }) {
  return (
    <section className="mx-auto max-w-[120rem] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
      <Wrap animate={animate}>
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
          {block.image && <Image src={block.image} alt={block.caption || "About Ratnavue"} fill className="object-cover" />}
        </div>
        {block.caption && <p className="mt-4 text-center text-sm text-charcoal/60">{block.caption}</p>}
      </Wrap>
    </section>
  );
}

function QuoteSection({ block, animate }: { block: Extract<AboutBlock, { type: "quote" }>; animate: boolean }) {
  return (
    <section className="flex min-h-dvh items-center border-y border-border-subtle bg-charcoal py-24 sm:py-32">
      <Wrap animate={animate} className="mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <p className="max-w-4xl font-serif text-4xl leading-snug text-ivory sm:text-6xl lg:text-7xl">
          {block.text} <span className="text-gold-soft">{block.highlight}</span>
        </p>
      </Wrap>
    </section>
  );
}

function PrinciplesSection({ block, animate }: { block: Extract<AboutBlock, { type: "principles" }>; animate: boolean }) {
  return (
    <section className="mx-auto max-w-[120rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 xl:px-16">
      <div className="grid gap-12 sm:gap-10 lg:gap-16" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {block.items.map((item, i) => (
          <Wrap animate={animate} delay={i * 0.08} key={`${block.id}-${i}`}>
            <span className="font-serif text-5xl text-gold/25 sm:text-6xl">{String(i + 1).padStart(2, "0")}</span>
            <h2 className="mt-3 font-serif text-2xl text-charcoal">{item.title}</h2>
            <p className="mt-3 leading-relaxed text-charcoal/70">{item.body}</p>
          </Wrap>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ block, animate }: { block: Extract<AboutBlock, { type: "cta" }>; animate: boolean }) {
  return (
    <section className="border-t border-border-subtle bg-ivory-soft py-20 text-center sm:py-28">
      <Wrap animate={animate} className="mx-auto max-w-xl px-5 sm:px-8">
        <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">{block.heading}</h2>
        <p className="mt-4 text-charcoal/70">{block.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/gems" variant="gold" size="lg">Shop Gemstones</LinkButton>
          <LinkButton href="/sourcing" variant="outline" size="lg">Submit a Sourcing Request</LinkButton>
        </div>
      </Wrap>
    </section>
  );
}

const SPACER_HEIGHTS: Record<SpacerHeight, string> = {
  sm: "h-8 sm:h-12",
  md: "h-16 sm:h-24",
  lg: "h-24 sm:h-36",
  xl: "h-32 sm:h-48",
};

function SpacerSection({ block }: { block: Extract<AboutBlock, { type: "spacer" }> }) {
  return <div className={cn("w-full", SPACER_HEIGHTS[block.height])} style={{ backgroundColor: block.color }} />;
}

function FullSection({ block, animate }: { block: AboutBlock; animate: boolean }) {
  switch (block.type) {
    case "hero":
      return <HeroSection block={block} animate={animate} />;
    case "text":
      return <TextSection block={block} animate={animate} />;
    case "imageCaption":
      return <ImageCaptionSection block={block} animate={animate} />;
    case "image":
      return <ImageBlockSection block={block} animate={animate} />;
    case "quote":
      return <QuoteSection block={block} animate={animate} />;
    case "principles":
      return <PrinciplesSection block={block} animate={animate} />;
    case "cta":
      return <CtaSection block={block} animate={animate} />;
    case "spacer":
      return <SpacerSection block={block} />;
    default:
      return null;
  }
}

// ---------- Boxed renderings (fit inside a fractional-width column) ----------
//
// Image, Principles, and CTA already adapt to any container width (they
// don't rely on the page's own edge-to-edge bleed or a nested internal
// grid split), so they're reused as-is. Hero, Text, ImageCaption, and
// Quote each get a compact variant here instead — full-viewport-height and
// side-by-side internal splits don't work once squeezed into, say, a
// quarter-width column.

function BoxedHero({ block }: { block: Extract<AboutBlock, { type: "hero" }> }) {
  return (
    <div className="relative flex aspect-[4/3] w-full items-end overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
      {block.image && <Image src={block.image} alt={block.heading} fill className="object-cover" />}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 40%, rgba(33,29,26,0.85) 100%)" }}
      />
      <div className="relative p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">{block.kicker}</p>
        <h2 className="mt-2 font-serif text-2xl leading-tight text-ivory sm:text-3xl">{block.heading}</h2>
      </div>
    </div>
  );
}

function BoxedText({ block }: { block: Extract<AboutBlock, { type: "text" }> }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{block.label}</p>
      <div className="mt-3 h-px w-10 bg-gold" />
      <p className="mt-5 font-serif text-xl leading-relaxed text-charcoal sm:text-2xl">{block.lead}</p>
      <p className="mt-5 leading-relaxed text-charcoal/70">{block.body1}</p>
      <p className="mt-4 leading-relaxed text-charcoal/70">{block.body2}</p>
    </div>
  );
}

function BoxedImageCaption({ block }: { block: Extract<AboutBlock, { type: "imageCaption" }> }) {
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-charcoal shadow-xl shadow-charcoal/10">
        {block.image && <Image src={block.image} alt={block.kicker} fill className="object-cover" />}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">{block.kicker}</p>
      <p className="mt-2 leading-relaxed text-charcoal/70">{block.body}</p>
    </div>
  );
}

function BoxedQuote({ block }: { block: Extract<AboutBlock, { type: "quote" }> }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl bg-charcoal p-8 shadow-xl shadow-charcoal/10 sm:p-10">
      <p className="font-serif text-2xl leading-snug text-ivory sm:text-3xl">
        {block.text} <span className="text-gold-soft">{block.highlight}</span>
      </p>
    </div>
  );
}

function BoxedBlock({ block }: { block: AboutBlock }) {
  switch (block.type) {
    case "hero":
      return <BoxedHero block={block} />;
    case "text":
      return <BoxedText block={block} />;
    case "imageCaption":
      return <BoxedImageCaption block={block} />;
    case "quote":
      return <BoxedQuote block={block} />;
    case "image":
      return <ImageBlockSection block={block} animate={false} />;
    case "principles":
      return <PrinciplesSection block={block} animate={false} />;
    case "cta":
      return <CtaSection block={block} animate={false} />;
    case "spacer":
      return <SpacerSection block={block} />;
    default:
      return null;
  }
}

function MultiColumnRow({ row, animate }: { row: AboutRow; animate: boolean }) {
  return (
    <section className="mx-auto max-w-[120rem] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-12 sm:gap-10 lg:gap-14">
        {row.columns.map((col, i) => (
          <Wrap animate={animate} delay={i * 0.06} key={col.id} className={cn("col-span-1", SPAN_CLASSES[col.span])}>
            <BoxedBlock block={col.block} />
          </Wrap>
        ))}
      </div>
    </section>
  );
}

export function AboutBlocksRenderer({ rows, animate = true }: { rows: AboutRow[]; animate?: boolean }) {
  return (
    <div>
      {rows.map((row) =>
        row.columns.length === 1 && row.columns[0].span === 12 ? (
          <FullSection key={row.id} block={row.columns[0].block} animate={animate} />
        ) : (
          <MultiColumnRow key={row.id} row={row} animate={animate} />
        ),
      )}
    </div>
  );
}
