import { prisma } from "@/lib/prisma";
import { toggleCutActive } from "@/actions/master-data";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminCutsPage() {
  const cuts = await prisma.cut.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Cuts</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        This is the fixed set of 18 standard gem cuts. You can enable or disable which ones are selectable, but new
        cuts aren&apos;t added here — the list is intentionally closed to keep the configurator and catalog consistent.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cuts.map((cut) => (
              <tr key={cut.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 text-charcoal">{cut.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{cut.category === "FACETED" ? "Faceted" : "Cabochon"}</td>
                <td className="px-4 py-3 text-charcoal/70">{cut.active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={cut.active} onToggle={toggleCutActive.bind(null, cut.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
