import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleGemstoneFeatured } from "@/actions/catalog-admin";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ToggleFeaturedButton } from "@/components/admin/ToggleFeaturedButton";
import { BackLink } from "@/components/admin/BackLink";

const PAGE_SIZE = 20;

export default async function AdminGemsPage({ searchParams }: PageProps<"/admin/gems">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [gems, total] = await Promise.all([
    prisma.gemstone.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { mineral: true, cut: true },
    }),
    prisma.gemstone.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Gemstones</h1>
        <Link href="/admin/gems/new">
          <Button variant="gold">Add Gemstone</Button>
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Click the star to feature a gem on the homepage. Turn the section itself on/off from{" "}
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
                  <ToggleFeaturedButton featured={gem.isFeatured} onToggle={toggleGemstoneFeatured.bind(null, gem.id)} />
                </td>
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal/50">No gemstones yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
