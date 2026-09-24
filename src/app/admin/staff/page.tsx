import { prisma } from "@/lib/prisma";
import { CreateStaffAccountForm } from "@/components/admin/CreateStaffAccountForm";
import { StaffAccountRow } from "@/components/admin/StaffAccountRow";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, staffMarketScope: true, createdAt: true },
  });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Staff Accounts</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            A staff account is restricted to order management only — communications on an order&apos;s own chat
            thread, adding tracking, marking bank transfers paid, and reverting a mistaken payment. Nothing else in
            the admin area (catalog, discount codes, settings, customers, other requests) is ever available to a
            staff account, regardless of store access.
          </p>
        </div>
        <div className="shrink-0"><CreateStaffAccountForm /></div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Store Access</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 text-charcoal">{s.name ?? "—"}</td>
                <td className="px-4 py-3 text-charcoal/70">{s.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{s.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StaffAccountRow userId={s.id} marketScope={s.staffMarketScope ?? "intl"} name={s.name ?? s.email} />
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-charcoal/50">No staff accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
