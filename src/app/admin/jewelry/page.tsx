import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function AdminJewelryPage() {
  const pieces = await prisma.jewelryPiece.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Jewelry</h1>
        <Link href="/admin/jewelry/new">
          <Button variant="gold">Add Jewelry Piece</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
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
                  <Link href={`/admin/jewelry/${piece.id}`} className="text-charcoal hover:text-gold">{piece.name}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{piece.pieceType}</td>
                <td className="px-4 py-3 text-charcoal/70">{piece.metalType}</td>
                <td className="px-4 py-3"><StockBadge status={piece.stockStatus} /></td>
                <td className="px-4 py-3 text-charcoal/70">{piece.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
            {pieces.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No jewelry pieces yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
