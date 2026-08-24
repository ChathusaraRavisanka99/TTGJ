"use client";

import { useRouter } from "next/navigation";
import { createMineral } from "@/actions/master-data";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateMineralForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await createMineral(formData);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 sm:grid-cols-4 sm:items-end">
      <div>
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
      <Button type="submit" variant="gold">Add Mineral</Button>
    </form>
  );
}
