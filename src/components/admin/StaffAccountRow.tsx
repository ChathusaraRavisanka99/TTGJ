"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffMarketScope, revokeStaffAccess } from "@/actions/staff";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function StaffAccountRow({ userId, marketScope, name }: { userId: string; marketScope: string; name: string }) {
  const router = useRouter();
  const [scope, setScope] = useState(marketScope);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function handleScopeChange(next: string) {
    setScope(next);
    startTransition(async () => {
      await updateStaffMarketScope(userId, next as "intl" | "lk" | "both");
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
  );
}
