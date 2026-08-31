import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, FileText, ExternalLink } from "lucide-react";
import { getGemstoneBySlug } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { buildCertVerifyUrl, formatPrice } from "@/lib/utils";
import { StockBadge } from "@/components/ui/Badge";
import { QuoteRequestPanel } from "@/components/quote/QuoteRequestPanel";
import { MediaGallery } from "@/components/catalog/MediaGallery";
import { Reveal } from "@/components/layout/Reveal";

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
  const verifyUrl = buildCertVerifyUrl(gem.certLab?.verifyUrlTemplate, gem.certReportNumber);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal y={16}>
          <MediaGallery media={gem.media} fallbackLabel={gem.name} />
        </Reveal>

        <Reveal delay={0.1} y={16}>
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
          {gem.showPrice && gem.price != null && (
            <p className="mt-2 font-serif text-2xl text-gold">{formatPrice(gem.price)}</p>
          )}
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
              <Spec label="Certification" value={[gem.certLab?.name, gem.certReportNumber].filter(Boolean).join(" · ")} />
            )}
          </dl>

          {(verifyUrl || gem.certFileUrl) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {verifyUrl && (
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-4 py-2 text-xs font-medium text-charcoal/80 transition-colors hover:border-gold hover:text-charcoal"
                >
                  <ShieldCheck size={14} /> Verify Certificate <ExternalLink size={12} />
                </a>
              )}
              {gem.certFileUrl && (
                <a
                  href={gem.certFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-4 py-2 text-xs font-medium text-charcoal/80 transition-colors hover:border-gold hover:text-charcoal"
                >
                  <FileText size={14} /> View Certificate
                </a>
              )}
            </div>
          )}

          <div className="mt-8">
            <QuoteRequestPanel
              isAuthenticated={!!session?.user}
              gemstoneId={gem.id}
              productLabel={gem.name}
            />
          </div>
        </Reveal>
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
