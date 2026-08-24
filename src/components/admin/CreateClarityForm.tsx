"use client";

import { useRouter } from "next/navigation";
import { createClarityGrade } from "@/actions/master-data";
import { Input, Textarea, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateClarityForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await createClarityGrade(formData);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 sm:grid-cols-4 sm:items-end">
      <div>
        <Label htmlFor="cg-name">Name</Label>
        <Input id="cg-name" name="name" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="cg-description">Description</Label>
        <Textarea id="cg-description" name="description" required />
      </div>
      <div>
        <Label htmlFor="cg-sortOrder">Sort Order</Label>
        <Input id="cg-sortOrder" name="sortOrder" type="number" defaultValue={0} />
      </div>
      <Button type="submit" variant="gold" className="sm:col-span-4">Add Clarity Grade</Button>
    </form>
  );
}
