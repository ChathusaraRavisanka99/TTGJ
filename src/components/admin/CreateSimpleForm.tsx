"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ActionResult } from "@/actions/auth";

export function CreateSimpleForm({
  action,
  label,
  placeholder,
  extraField,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  label: string;
  placeholder?: string;
  extraField?: { name: string; label: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await action(formData);
    setPending(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>{label}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <form action={handleSubmit} className="grid gap-3">
          <div>
            <Label htmlFor="simple-name">Name</Label>
            <Input id="simple-name" name="name" required placeholder={placeholder} />
          </div>
          {extraField && (
            <label className="flex items-center gap-2 text-sm text-charcoal/75">
              <input type="checkbox" name={extraField.name} className="accent-gold" />
              {extraField.label}
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={pending}>{pending ? "Adding..." : "Add"}</Button>
          </div>
          <FieldError>{error ?? undefined}</FieldError>
        </form>
      </Modal>
    </>
  );
}
