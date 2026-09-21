import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleJewelryFeatured } from "@/actions/catalog-admin";
import { StockBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ToggleFeaturedButton } from "@/components/admin/ToggleFeaturedButton";
import { BackLink } from "@/components/admin/BackLink";
import { StoreFilterTabs, parseStoreFilter } from "@/components/admin/StoreFilterTabs";
import { formatPrice } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminJewelryPage({ searchParams }: PageProps<"/admin/jewelry">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const store = parseStoreFilter(sp.market);
  const where = store === "all" ? undefined : { market: store };

  const [pieces, total] = await Promise.all([
    prisma.jewelryPiece.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.jewelryPiece.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-charcoal">Jewelry</h1>
        <div className="flex gap-2">
          <Link href="/admin/jewelry/new">
            <Button variant="gold">Add International Piece</Button>
          </Link>
          <Link href="/admin/jewelry/new?market=lk">
            <Button variant="outline">Add Sri Lanka Piece</Button>
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Each piece belongs to one store — the international and Sri Lanka catalogs are separate and never overlap.
        Click the star to feature a piece on its own store&apos;s home page. Turn the section itself on/off from{" "}
        <Link href="/admin/content/home" className="underline decoration-charcoal/30 underline-offset-2 hover:text-gold">
          Home Page content
        </Link>.
      </p>

      <StoreFilterTabs basePath="/admin/jewelry" current={store} />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="w-10 px-4 py-3">
                <span className="sr-only">Featured</span>
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Metal</th>
              <th className="px-4 py-3">Retail price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece) => (
              <tr key={piece.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <ToggleFeaturedButton
                    featured={piece.isFeatured}
                    store={piece.market === "lk" ? "Sri Lanka home page" : "homepage"}
                    onToggle={toggleJewelryFeatured.bind(null, piece.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/jewelry/${piece.id}`} className="text-charcoal hover:text-gold">{piece.name}</Link>
                </td>
                <td className="px-4 py-3">
                  <Badge className={piece.market === "lk" ? "border-gold/40 bg-gold/15 text-charcoal" : "border-border-subtle bg-charcoal/5 text-charcoal/70"}>
                    {piece.market === "lk" ? "Sri Lanka" : "International"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{piece.pieceType}</td>
                <td className="px-4 py-3 text-charcoal/70">{piece.metalType}</td>
                <td className="px-4 py-3 text-charcoal/70">
                  {piece.market === "lk"
                    ? piece.lkrRetailPrice != null ? formatPrice(piece.lkrRetailPrice, "LKR") : "—"
                    : piece.retailPrice != null ? formatPrice(piece.retailPrice) : "—"}
                </td>
                <td className="px-4 py-3"><StockBadge status={piece.stockStatus} /></td>
                <td className="px-4 py-3 text-charcoal/70">{piece.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
            {pieces.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal/50">No jewelry pieces yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
