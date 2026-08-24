import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGemstoneBySlug } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { Gem3D } from "@/components/gem-visualizer/Gem3D";
import { StockBadge } from "@/components/ui/Badge";
import { QuoteRequestPanel } from "@/components/quote/QuoteRequestPanel";
import { MediaGallery } from "@/components/catalog/MediaGallery";

export async function generateMetadata({ params }: PageProps<"/gems/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const gem = await getGemstoneBySlug(slug);
  if (!gem) return {};
  return {
    title: gem.name,
    description: gem.description ?? `${gem.mineral.name}, ${gem.caratWeight}ct ${gem.cut.name} — Ceylon gemstone by Ratnavue.`,
  };
}

export default async function GemDetailPage({ params }: PageProps<"/gems/[slug]">) {
  const { slug } = await params;
  const [gem, session] = await Promise.all([getGemstoneBySlug(slug), auth()]);

  if (!gem || !gem.isPublished) notFound();

  const dimensions = [gem.lengthMm, gem.widthMm, gem.depthMm].filter(Boolean).join(" x ");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div className="rounded-2xl border border-border-subtle bg-gradient-to-b from-ivory-soft to-ivory p-8">
            <Gem3D
              cutSlug={gem.cut.slug}
              hue={gem.colorHue}
              darkness={gem.colorLightness}
              claritySlug={gem.clarityGrade.slug}
              caratWeight={gem.caratWeight}
              seedKey={gem.slug}
              className="aspect-square w-full"
            />
          </div>
          <p className="mt-2 text-center text-xs text-charcoal/45">
            Drag to rotate · illustrative rendering based on this stone&apos;s recorded cut, colour, tone, and clarity — not a photograph.
          </p>

          {gem.media.length > 0 && (
            <div className="mt-6">
              <MediaGallery media={gem.media} fallbackLabel={gem.name} />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-gold">{gem.mineral.name}</p>
            <StockBadge status={gem.stockStatus} />
            {gem.origin.isCeylon && (
              <span className="rounded-full bg-charcoal/85 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-ivory">
                Ceylon Origin
              </span>
            )}
          </div>
          <h1 className="mt-2 font-serif text-4xl text-charcoal">{gem.name}</h1>
          {gem.description && <p className="mt-4 leading-relaxed text-charcoal/70">{gem.description}</p>}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border-subtle py-6">
            <Spec label="Cut" value={gem.cut.name} />
            <Spec label="Carat Weight" value={`${gem.caratWeight} ct`} />
            {dimensions && <Spec label="Dimensions" value={`${dimensions} mm`} />}
            <Spec label="Colour" value={gem.colorLabel ?? "—"} />
            <Spec label="Clarity" value={gem.clarityGrade.name} hint={gem.clarityGrade.description} />
            <Spec label="Treatment" value={gem.treatment.name} />
            <Spec label="Origin" value={gem.origin.name} />
            {gem.variety && <Spec label="Variety" value={gem.variety} />}
            {gem.symmetryNotes && <Spec label="Symmetry / Polish" value={gem.symmetryNotes} />}
            {(gem.certLab || gem.certReportNumber) && (
              <Spec label="Certification" value={[gem.certLab, gem.certReportNumber].filter(Boolean).join(" · ")} />
            )}
          </dl>

          <div className="mt-8">
            <QuoteRequestPanel
              isAuthenticated={!!session?.user}
              gemstoneId={gem.id}
              productLabel={gem.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-charcoal/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-charcoal">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-charcoal/45">{hint}</p>}
    </div>
  );
}
