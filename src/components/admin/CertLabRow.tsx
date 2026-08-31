"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCertLab, deleteCertLab, toggleCertLabActive } from "@/actions/master-data";
import { Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface CertLab {
  id: string;
  name: string;
  verifyUrlTemplate: string | null;
  active: boolean;
}

export function CertLabRow({ lab }: { lab: CertLab }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSave(formData: FormData) {
    setError(null);
    const result = await updateCertLab(lab.id, formData);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <tr className="border-b border-border-subtle last:border-0">
        <td className="px-4 py-3 text-charcoal">{lab.name}</td>
        <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-charcoal/70" title={lab.verifyUrlTemplate ?? undefined}>
          {lab.verifyUrlTemplate || <span className="text-charcoal/35">— no public lookup —</span>}
        </td>
        <td className="px-4 py-3 text-charcoal/70">{lab.active ? "Active" : "Inactive"}</td>
        <td className="px-4 py-3 space-x-3">
          <button className="text-xs text-gold underline" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="text-xs text-charcoal/60 underline"
            disabled={pending}
            onClick={() => startTransition(async () => { await toggleCertLabActive(lab.id, !lab.active); router.refresh(); })}
          >
            {lab.active ? "Deactivate" : "Activate"}
          </button>
          <button
            className="text-xs text-red-700 underline"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete "${lab.name}"? Any gemstones citing it will keep their report number but lose the lab link.`)) {
                startTransition(async () => { await deleteCertLab(lab.id); router.refresh(); });
              }
            }}
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border-subtle bg-ivory-soft last:border-0">
      <td colSpan={4} className="px-4 py-4">
        <form action={handleSave} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input name="name" defaultValue={lab.name} required />
          <Input name="verifyUrlTemplate" defaultValue={lab.verifyUrlTemplate ?? ""} placeholder="https://...{certId}" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="gold">Save</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <input type="hidden" name="active" value={lab.active ? "true" : "false"} />
        </form>
        <FieldError>{error ?? undefined}</FieldError>
      </td>
    </tr>
  );
}
