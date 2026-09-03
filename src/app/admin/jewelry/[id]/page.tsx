import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JewelryForm } from "@/components/admin/JewelryForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { GemstoneLinkManager } from "@/components/admin/GemstoneLinkManager";
import { BackLink } from "@/components/admin/BackLink";

export default async function EditJewelryPage({ params }: PageProps<"/admin/jewelry/[id]">) {
  const { id } = await params;
  const [piece, gemstones] = await Promise.all([
    prisma.jewelryPiece.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: "asc" } }, gemstones: { include: { gemstone: true } } },
    }),
    prisma.gemstone.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!piece) notFound();

  return (
    <div>
      <BackLink href="/admin/jewelry" label="Back to Jewelry" />
      <h1 className="font-serif text-3xl text-charcoal">{piece.name}</h1>

      <div className="mt-6">
        <JewelryForm initial={piece} />
      </div>

      <div className="mt-10 max-w-2xl border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Media</p>
        <div className="mt-4">
          <MediaManager media={piece.media} jewelryId={piece.id} />
        </div>
      </div>

      <div className="mt-10 max-w-2xl border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Gemstones Set In This Piece</p>
        <div className="mt-4">
          <GemstoneLinkManager jewelryId={piece.id} links={piece.gemstones} gemstones={gemstones} />
        </div>
      </div>
    </div>
  );
}
