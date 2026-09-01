"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClarityGrade } from "@/actions/master-data";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateClarityForm() {
  const router = useRouter();
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
    router.refresh();
  }

  return (
    // No sm:items-end here: the Description textarea is intrinsically
    // taller than the plain Name/Sort Order inputs, and bottom-aligning
    // grid items dragged those shorter fields' labels down out of line
    // with Description's — a genuinely jumbled-looking layout.
    <form action={handleSubmit} className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 sm:grid-cols-4">
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
      <Button type="submit" variant="gold" className="sm:col-span-4" disabled={pending}>
        {pending ? "Adding..." : "Add Clarity Grade"}
      </Button>
      <FieldError className="sm:col-span-4">{error ?? undefined}</FieldError>
    </form>
  );
}
