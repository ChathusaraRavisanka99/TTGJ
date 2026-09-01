"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClarityGrade } from "@/actions/master-data";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function CreateClarityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createClarityGrade(formData);
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
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>Add Clarity Grade</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Clarity Grade">
        <form action={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cg-name">Name</Label>
            <Input id="cg-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="cg-sortOrder">Sort Order</Label>
            <Input id="cg-sortOrder" name="sortOrder" type="number" defaultValue={0} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cg-description">Description</Label>
            <Textarea id="cg-description" name="description" required />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Adding..." : "Add Clarity Grade"}
            </Button>
          </div>
          <FieldError className="sm:col-span-2">{error ?? undefined}</FieldError>
        </form>
      </Modal>
    </>
  );
}
