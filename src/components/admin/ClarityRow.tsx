"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClarityGrade, deleteClarityGrade } from "@/actions/master-data";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Grade {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export function ClarityRow({ grade }: { grade: Grade }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSave(formData: FormData) {
    await updateClarityGrade(grade.id, formData);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <tr className="border-b border-border-subtle last:border-0">
        <td className="px-4 py-3 text-charcoal">{grade.name}</td>
        <td className="px-4 py-3 text-charcoal/70">{grade.description}</td>
        <td className="px-4 py-3 text-charcoal/70">{grade.sortOrder}</td>
        <td className="px-4 py-3 space-x-3">
          <button className="text-xs text-gold underline" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="text-xs text-red-700 underline"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete "${grade.name}"?`)) startTransition(async () => { await deleteClarityGrade(grade.id); router.refresh(); });
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
        <form action={handleSave} className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <Input name="name" defaultValue={grade.name} required />
          </div>
          <div className="sm:col-span-2">
            <Textarea name="description" defaultValue={grade.description} required />
          </div>
          <div>
            <Input name="sortOrder" type="number" defaultValue={grade.sortOrder} />
          </div>
          <div className="flex gap-2 sm:col-span-4">
            <Button type="submit" size="sm" variant="gold">Save</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <input type="hidden" name="active" value={grade.active ? "true" : "false"} />
        </form>
      </td>
    </tr>
  );
}
