import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleJewelryFeatured } from "@/actions/catalog-admin";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ToggleFeaturedButton } from "@/components/admin/ToggleFeaturedButton";

const PAGE_SIZE = 20;

export default async function AdminJewelryPage({ searchParams }: PageProps<"/admin/jewelry">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [pieces, total] = await Promise.all([
    prisma.jewelryPiece.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.jewelryPiece.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Jewelry</h1>
        <Link href="/admin/jewelry/new">
          <Button variant="gold">Add Jewelry Piece</Button>
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Click the star to feature a piece on the homepage. Turn the section itself on/off from{" "}
        <Link href="/admin/content/home" className="underline decoration-charcoal/30 underline-offset-2 hover:text-gold">
          Home Page content
        </Link>.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="w-10 px-4 py-3">
                <span className="sr-only">Featured</span>
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Metal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece) => (
              <tr key={piece.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <ToggleFeaturedButton featured={piece.isFeatured} onToggle={toggleJewelryFeatured.bind(null, piece.id)} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/jewelry/${piece.id}`} className="text-charcoal hover:text-gold">{piece.name}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{piece.pieceType}</td>
                <td className="px-4 py-3 text-charcoal/70">{piece.metalType}</td>
                <td className="px-4 py-3"><StockBadge status={piece.stockStatus} /></td>
                <td className="px-4 py-3 text-charcoal/70">{piece.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
            {pieces.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No jewelry pieces yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
