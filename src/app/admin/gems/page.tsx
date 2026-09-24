import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasStaffArea, marketFilterFor } from "@/lib/rbac";
import { toggleGemstoneFeatured } from "@/actions/catalog-admin";
import { StockBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ToggleFeaturedButton } from "@/components/admin/ToggleFeaturedButton";
import { BackLink } from "@/components/admin/BackLink";
import { StoreFilterTabs, parseStoreFilter } from "@/components/admin/StoreFilterTabs";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { CatalogBulkSelectionProvider, CatalogRowCheckbox, CatalogBulkToolbar } from "@/components/admin/CatalogBulkSelection";
import { formatPrice } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminGemsPage({ searchParams }: PageProps<"/admin/gems">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const session = await auth();
  const user = session?.user;
  if (!user || !hasStaffArea(user, "catalog")) notFound();
  const staff = user.role === "STAFF";
  // A STAFF member scoped to one store only ever sees that store's items,
  // whatever the query string asks for.
  const scopedMarket = marketFilterFor(user);
  const store = scopedMarket ?? parseStoreFilter(sp.market);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where = {
    ...(store === "all" ? {} : { market: store }),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [gems, total] = await Promise.all([
    prisma.gemstone.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { mineral: true, cut: true },
    }),
    prisma.gemstone.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {!staff && <BackLink href="/admin" label="Back to Dashboard" />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-charcoal">Gemstones</h1>
        <div className="flex gap-2">
          {(!scopedMarket || scopedMarket === "intl") && (
            <Link href="/admin/gems/new">
              <Button variant="gold">Add International Gemstone</Button>
            </Link>
          )}
          {(!scopedMarket || scopedMarket === "lk") && (
            <Link href="/admin/gems/new?market=lk">
              <Button variant="outline">Add Sri Lanka Gemstone</Button>
            </Link>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Each gemstone belongs to one store — the international and Sri Lanka catalogs are separate and never overlap.
        Click the star to feature a gem on its own store&apos;s home page. Turn the section itself on/off from{" "}
        <Link href="/admin/content/home" className="underline decoration-charcoal/30 underline-offset-2 hover:text-gold">
          Home Page content
        </Link>.
      </p>

      <div className="mt-4">
        <AdminSearchBox placeholder="Search gemstones by name..." />
      </div>

      {!scopedMarket && <StoreFilterTabs basePath="/admin/gems" current={store} q={q} />}

      <CatalogBulkSelectionProvider>
        <CatalogBulkToolbar kind="gemstone" />
        <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Featured</span>
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Mineral</th>
                <th className="px-4 py-3">Cut</th>
                <th className="px-4 py-3">Carat</th>
                <th className="px-4 py-3">Retail price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
              </tr>
            </thead>
            <tbody>
              {gems.map((gem) => (
                <tr key={gem.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                  <td className="px-4 py-3">
                    <CatalogRowCheckbox id={gem.id} />
                  </td>
                  <td className="px-4 py-3">
                    {!staff && (
                      <ToggleFeaturedButton
                        featured={gem.isFeatured}
                        store={gem.market === "lk" ? "Sri Lanka home page" : "homepage"}
                        onToggle={toggleGemstoneFeatured.bind(null, gem.id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/gems/${gem.id}`} className="text-charcoal hover:text-gold">{gem.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={gem.market === "lk" ? "border-gold/40 bg-gold/15 text-charcoal" : "border-border-subtle bg-charcoal/5 text-charcoal/70"}>
                      {gem.market === "lk" ? "Sri Lanka" : "International"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{gem.mineral.name}</td>
                  <td className="px-4 py-3 text-charcoal/70">{gem.cut.name}</td>
                  <td className="px-4 py-3 text-charcoal/70">{gem.caratWeight} ct</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {gem.market === "lk"
                      ? gem.lkrRetailPrice != null ? formatPrice(gem.lkrRetailPrice, "LKR") : "—"
                      : gem.retailPrice != null ? formatPrice(gem.retailPrice) : "—"}
                  </td>
                  <td className="px-4 py-3"><StockBadge status={gem.stockStatus} /></td>
                  <td className="px-4 py-3 text-charcoal/70">{gem.isPublished ? "Yes" : "No"}</td>
                </tr>
              ))}
              {gems.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-charcoal/50">No gemstones yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CatalogBulkSelectionProvider>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
