"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffMarketScope, updateStaffPermissions, revokeStaffAccess } from "@/actions/staff";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DisableUserControl } from "@/components/admin/DisableUserControl";
import { STAFF_AREAS, STAFF_AREA_LABELS } from "@/lib/staff-permissions";

export function StaffAccountRow({ userId, marketScope, permissions, name, disabled }: { userId: string; marketScope: string; permissions: string[]; name: string; disabled: { label: string; reason: string | null } | null }) {
  const router = useRouter();
  const [scope, setScope] = useState(marketScope);
  const [areas, setAreas] = useState<string[]>(permissions);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function handleScopeChange(next: string) {
    setScope(next);
    startTransition(async () => {
      await updateStaffMarketScope(userId, next as "intl" | "lk" | "both");
      router.refresh();
    });
  }

  function handleAreaToggle(area: string, on: boolean) {
    const next = on ? [...areas, area] : areas.filter((a) => a !== area);
    setAreas(next);
    startTransition(async () => {
      await updateStaffPermissions(userId, next);
      router.refresh();
    });
  }

  async function handleRevoke() {
    if (!(await confirm(`Revoke ${name}'s staff access? Their account becomes a normal customer account — this can be undone by creating a new staff account for the same email later.`, { confirmLabel: "Revoke Access", danger: true }))) return;
    startTransition(async () => {
      await revokeStaffAccess(userId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {STAFF_AREAS.map((area) => (
          <label key={area} className="flex items-center gap-1.5 text-xs text-charcoal/80" title={STAFF_AREA_LABELS[area].description}>
            <input type="checkbox" checked={areas.includes(area)} disabled={pending} onChange={(e) => handleAreaToggle(area, e.target.checked)} className="accent-gold" />
            {STAFF_AREA_LABELS[area].label}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Select value={scope} onChange={(e) => handleScopeChange(e.target.value)} disabled={pending} className="w-auto py-1.5 text-xs">
          <option value="intl">International only</option>
          <option value="lk">Sri Lanka only</option>
          <option value="both">Both stores</option>
        </Select>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleRevoke}>
          Revoke Access
        </Button>
      </div>
      <DisableUserControl userId={userId} name={name} status={disabled} />
      {areas.length === 0 && <p className="text-xs text-red-700">No areas switched on — this account can&apos;t open anything.</p>}
    </div>
  );
}
