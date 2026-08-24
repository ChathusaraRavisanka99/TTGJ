"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMineral, deleteMineral, toggleMineralActive } from "@/actions/master-data";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Mineral {
  id: string;
  name: string;
  description: string | null;
  hueMin: number;
  hueMax: number;
  active: boolean;
}

export function MineralRow({ mineral }: { mineral: Mineral }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSave(formData: FormData) {
    await updateMineral(mineral.id, formData);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <tr className="border-b border-border-subtle last:border-0">
        <td className="px-4 py-3 text-charcoal">{mineral.name}</td>
        <td className="px-4 py-3 text-charcoal/70">{mineral.hueMin}° – {mineral.hueMax}°</td>
        <td className="px-4 py-3 text-charcoal/70">{mineral.active ? "Active" : "Inactive"}</td>
        <td className="px-4 py-3 space-x-3">
          <button className="text-xs text-gold underline" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="text-xs text-charcoal/60 underline"
            disabled={pending}
            onClick={() => startTransition(async () => { await toggleMineralActive(mineral.id, !mineral.active); router.refresh(); })}
          >
            {mineral.active ? "Deactivate" : "Activate"}
          </button>
          <button
            className="text-xs text-red-700 underline"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete "${mineral.name}"?`)) startTransition(async () => { await deleteMineral(mineral.id); router.refresh(); });
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
        <form action={handleSave} className="grid gap-3 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2">
            <Input name="name" defaultValue={mineral.name} required />
          </div>
          <div>
            <Input name="hueMin" type="number" min={0} max={360} defaultValue={mineral.hueMin} required />
          </div>
          <div>
            <Input name="hueMax" type="number" min={0} max={360} defaultValue={mineral.hueMax} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="gold">Save</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <div className="sm:col-span-5">
            <Textarea name="description" defaultValue={mineral.description ?? ""} placeholder="Description" />
          </div>
          <input type="hidden" name="active" value={mineral.active ? "true" : "false"} />
        </form>
      </td>
    </tr>
  );
}
