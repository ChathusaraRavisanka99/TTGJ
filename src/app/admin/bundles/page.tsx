import { prisma } from "@/lib/prisma";
import { toggleBundleActive } from "@/actions/bundles";
import { BundleBuilder } from "@/components/admin/BundleBuilder";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { DeleteBundleButton } from "@/components/admin/DeleteBundleButton";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: [{ market: "asc" }, { sortOrder: "asc" }],
    include: { items: { include: { gemstone: { select: { name: true } }, jewelry: { select: { name: true } } } } },
  });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Bundles</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Curated sets of 2+ existing items sold together — the discount applies automatically once every item in a
        set is in the same cart, the way a discount code does. No effect on inventory, profit tracking, or refunds
        for the individual items themselves.
      </p>

      <div className="mt-6">
        <BundleBuilder />
      </div>

      <div className="mt-8 space-y-4">
        {bundles.length === 0 ? (
          <p className="text-sm text-charcoal/60">No bundles yet.</p>
        ) : (
          bundles.map((bundle) => (
            <div key={bundle.id} className="rounded-xl border border-border-subtle bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-charcoal">{bundle.name}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-charcoal/50">
                    {bundle.market === "lk" ? "Sri Lanka" : "International"} · {formatPrice(bundle.price, bundle.market === "lk" ? "LKR" : "USD")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ToggleActiveButton active={bundle.active} onToggle={toggleBundleActive.bind(null, bundle.id)} />
                  <DeleteBundleButton id={bundle.id} name={bundle.name} />
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 text-xs text-charcoal/70">
                {bundle.items.map((item) => (
                  <li key={item.id} className="rounded-full border border-border-subtle px-2.5 py-1">
                    {item.gemstone?.name ?? item.jewelry?.name ?? "Deleted item"}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
