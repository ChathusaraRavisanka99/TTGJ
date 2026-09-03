import { prisma } from "@/lib/prisma";
import { ClarityRow } from "@/components/admin/ClarityRow";
import { CreateClarityForm } from "@/components/admin/CreateClarityForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminClarityPage() {
  const grades = await prisma.clarityGrade.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Clarity Scale</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        A simplified colored-gemstone clarity scale (not the diamond GIA scale), shown to customers on product pages and the configurator.
      </p>

      <div className="mt-6">
        <CreateClarityForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => <ClarityRow key={g.id} grade={g} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
