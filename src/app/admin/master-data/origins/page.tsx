import { prisma } from "@/lib/prisma";
import { createOrigin, toggleOriginActive } from "@/actions/master-data";
import { CreateSimpleForm } from "@/components/admin/CreateSimpleForm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

export default async function AdminOriginsPage() {
  const origins = await prisma.origin.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Origins</h1>
      <p className="mt-1 text-sm text-charcoal/60">Ceylon origin is called out prominently across the storefront.</p>

      <div className="mt-6">
        <CreateSimpleForm action={createOrigin} placeholder="E.g. Madagascar" extraField={{ name: "isCeylon", label: "Is Ceylon origin" }} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Ceylon</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {origins.map((o) => (
              <tr key={o.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 text-charcoal">{o.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.isCeylon ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={o.active} onToggle={toggleOriginActive.bind(null, o.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
