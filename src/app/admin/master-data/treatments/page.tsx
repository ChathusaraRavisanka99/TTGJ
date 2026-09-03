import { prisma } from "@/lib/prisma";
import { createTreatment, toggleTreatmentActive } from "@/actions/master-data";
import { CreateSimpleForm } from "@/components/admin/CreateSimpleForm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminTreatmentsPage() {
  const treatments = await prisma.treatment.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Treatments</h1>
      <p className="mt-1 text-sm text-charcoal/60">Disclosed prominently on every gemstone — treatment transparency matters to buyers.</p>

      <div className="mt-6">
        <CreateSimpleForm action={createTreatment} label="Add Treatment" placeholder="E.g. Diffusion" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 text-charcoal">{t.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{t.active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={t.active} onToggle={toggleTreatmentActive.bind(null, t.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
