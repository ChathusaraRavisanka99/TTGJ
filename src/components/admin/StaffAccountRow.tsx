"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffMarketScope, updateStaffPermissions, revokeStaffAccess } from "@/actions/staff";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DisableUserControl } from "@/components/admin/DisableUserControl";
import { STAFF_AREAS, STAFF_AREA_LABELS } from "@/lib/staff-permissions";
import { CARD_TR, CARD_TD, CARD_FIRST, CARD_SECOND, CARD_TD_ACTIONS } from "@/components/admin/responsive-table";

/** One staff member as a table row: who they are, which store(s), a tick box
 * per area (the columns line up with the page's header), whether the account
 * is active, and the row actions. Every change saves as soon as it's made. */
export function StaffAccountRow({
  userId,
  name,
  email,
  added,
  marketScope,
  permissions,
  disabled,
}: {
  userId: string;
  name: string;
  email: string;
  added: string;
  marketScope: string;
  permissions: string[];
  disabled: { label: string; reason: string | null } | null;
}) {
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
    <tr className={`${CARD_TR} align-middle`}>
      <td className={`${CARD_FIRST} lg:py-4`}>
        <p className="font-medium text-charcoal">{name}</p>
        <p className="text-xs text-charcoal/65">{email}</p>
        <p className="mt-0.5 text-[11px] text-charcoal/55">Added {added}</p>
        {areas.length === 0 && <p className="mt-1 text-xs text-red-700">No areas on — can&apos;t open anything.</p>}
      </td>
      <td data-label="Store" className={`${CARD_TD} lg:px-3 lg:py-4`}>
        <Select value={scope} onChange={(e) => handleScopeChange(e.target.value)} disabled={pending} className="w-auto min-w-36 py-1.5 text-xs">
          <option value="intl">International</option>
          <option value="lk">Sri Lanka</option>
          <option value="both">Both stores</option>
        </Select>
      </td>
      {STAFF_AREAS.map((area) => (
        <td key={area} data-label={STAFF_AREA_LABELS[area].short} className={`${CARD_TD} max-lg:items-center lg:px-2 lg:py-4 lg:text-center`}>
          <input
            type="checkbox"
            checked={areas.includes(area)}
            disabled={pending}
            onChange={(e) => handleAreaToggle(area, e.target.checked)}
            aria-label={`${STAFF_AREA_LABELS[area].label} for ${name}`}
            className="h-4 w-4 cursor-pointer accent-gold"
          />
        </td>
      ))}
      <td data-label="Status" className={`${CARD_SECOND} lg:px-3 lg:py-4`}>
        {disabled ? (
          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs text-red-700" title={disabled.reason ?? undefined}>
            {disabled.label}
          </span>
        ) : (
          <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800">Active</span>
        )}
      </td>
      <td className={`${CARD_TD_ACTIONS} lg:whitespace-nowrap lg:py-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <DisableUserControl userId={userId} name={name} status={disabled} showBadge={false} />
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={handleRevoke} className="text-red-700 hover:bg-red-50">
            Revoke access
          </Button>
        </div>
      </td>
    </tr>
  );
}
