import { prisma } from "@/lib/prisma";
import { CreateStaffAccountForm } from "@/components/admin/CreateStaffAccountForm";
import { GrantStaffAccessForm } from "@/components/admin/GrantStaffAccessForm";
import { describeDisabled } from "@/lib/user-status";
import { STAFF_AREAS, STAFF_AREA_LABELS } from "@/lib/staff-permissions";
import { StaffAccountRow } from "@/components/admin/StaffAccountRow";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, staffMarketScope: true, staffPermissions: true, disabledAt: true, disabledUntil: true, disabledReason: true, createdAt: true },
  });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Staff Accounts</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Choose exactly which parts of the back office each staff member gets. Orders, gems, jewelry and
            reviews are also limited to the store(s) you pick. Nothing outside the areas you switch on
            (discount codes, settings, customers, analytics, deleting items, cost prices…) is ever available to a
            staff account. Changes apply on their next page load.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <GrantStaffAccessForm />
          <CreateStaffAccountForm />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full min-w-[72rem] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/65">
              <th className="px-4 py-3 font-medium">Staff member</th>
              <th className="px-3 py-3 font-medium">Store</th>
              {STAFF_AREAS.map((area) => (
                <th key={area} className="w-24 px-2 py-3 text-center font-medium leading-tight" title={STAFF_AREA_LABELS[area].description}>
                  {STAFF_AREA_LABELS[area].short}
                </th>
              ))}
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const disabled = describeDisabled(s);
              return (
                <StaffAccountRow
                  key={s.id}
                  userId={s.id}
                  name={s.name ?? s.email}
                  email={s.email}
                  added={s.createdAt.toLocaleDateString()}
                  marketScope={s.staffMarketScope ?? "intl"}
                  permissions={s.staffPermissions}
                  disabled={disabled ? { label: disabled, reason: s.disabledReason } : null}
                />
              );
            })}
            {staff.length === 0 && (
              <tr><td colSpan={4 + STAFF_AREAS.length} className="px-4 py-8 text-center text-charcoal/65">No staff accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
