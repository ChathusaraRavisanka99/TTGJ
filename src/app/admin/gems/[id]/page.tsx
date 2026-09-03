import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMasterData } from "@/lib/catalog";
import { GemstoneForm } from "@/components/admin/GemstoneForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { CertificateManager } from "@/components/admin/CertificateManager";
import { BackLink } from "@/components/admin/BackLink";

export default async function EditGemstonePage({ params }: PageProps<"/admin/gems/[id]">) {
  const { id } = await params;
  const [gem, masterData] = await Promise.all([
    prisma.gemstone.findUnique({ where: { id }, include: { media: { orderBy: { sortOrder: "asc" } } } }),
    getMasterData(),
  ]);

  if (!gem) notFound();

  return (
    <div>
      <BackLink href="/admin/gems" label="Back to Gemstones" />
      <h1 className="font-serif text-3xl text-charcoal">{gem.name}</h1>

      <div className="mt-6">
        <GemstoneForm
          minerals={masterData.minerals}
          cuts={masterData.cuts}
          clarityGrades={masterData.clarityGrades}
          treatments={masterData.treatments}
          origins={masterData.origins}
          certificationLabs={masterData.certificationLabs}
          initial={gem}
        />
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Media</p>
        <div className="mt-4">
          <MediaManager media={gem.media} gemstoneId={gem.id} />
        </div>
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Certificate File</p>
        <p className="mt-1 text-sm text-charcoal/60">
          Attach a scan or photo of the lab report itself, separate from the online verification link above.
        </p>
        <div className="mt-4">
          <CertificateManager gemstoneId={gem.id} certFileUrl={gem.certFileUrl} />
        </div>
      </div>
    </div>
  );
}
