"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMineral } from "@/actions/master-data";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function CreateMineralForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createMineral(formData);
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
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>Add Mineral</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Mineral">
        <form action={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" name="name" required placeholder="E.g. Iolite" />
          </div>
          <div>
            <Label htmlFor="new-hueMin">Hue Min</Label>
            <Input id="new-hueMin" name="hueMin" type="number" min={0} max={360} required />
          </div>
          <div>
            <Label htmlFor="new-hueMax">Hue Max</Label>
            <Input id="new-hueMax" name="hueMax" type="number" min={0} max={360} required />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Adding..." : "Add Mineral"}
            </Button>
          </div>
          <FieldError className="sm:col-span-2">{error ?? undefined}</FieldError>
        </form>
      </Modal>
    </>
  );
}
