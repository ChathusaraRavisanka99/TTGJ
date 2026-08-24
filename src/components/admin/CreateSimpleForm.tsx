"use client";

import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateSimpleForm({
  action,
  placeholder,
  extraField,
}: {
  action: (formData: FormData) => Promise<unknown>;
  placeholder?: string;
  extraField?: { name: string; label: string };
}) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await action(formData);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-5">
      <div>
        <Label htmlFor="simple-name">Name</Label>
        <Input id="simple-name" name="name" required placeholder={placeholder} className="w-64" />
      </div>
      {extraField && (
        <label className="flex items-center gap-2 pb-2.5 text-sm text-charcoal/75">
          <input type="checkbox" name={extraField.name} className="accent-gold" />
          {extraField.label}
        </label>
      )}
      <Button type="submit" variant="gold">Add</Button>
    </form>
  );
}
