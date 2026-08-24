import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function AdminGemsPage() {
  const gems = await prisma.gemstone.findMany({
    orderBy: { createdAt: "desc" },
    include: { mineral: true, cut: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Gemstones</h1>
        <Link href="/admin/gems/new">
          <Button variant="gold">Add Gemstone</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mineral</th>
              <th className="px-4 py-3">Cut</th>
              <th className="px-4 py-3">Carat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {gems.map((gem) => (
              <tr key={gem.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/gems/${gem.id}`} className="text-charcoal hover:text-gold">{gem.name}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{gem.mineral.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{gem.cut.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{gem.caratWeight} ct</td>
                <td className="px-4 py-3"><StockBadge status={gem.stockStatus} /></td>
                <td className="px-4 py-3 text-charcoal/70">{gem.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
            {gems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No gemstones yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
