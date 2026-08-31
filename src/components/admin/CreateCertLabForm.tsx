"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCertLab } from "@/actions/master-data";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateCertLabForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createCertLab(formData);
    setPending(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div>
          <Label htmlFor="new-lab-name">Name</Label>
          <Input id="new-lab-name" name="name" required placeholder="E.g. GIA" />
        </div>
        <div>
          <Label htmlFor="new-lab-url">Verification URL (optional)</Label>
          <Input
            id="new-lab-url"
            name="verifyUrlTemplate"
            placeholder="https://www.example-lab.org/verify?reportno={certId}"
          />
        </div>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Adding..." : "Add Lab"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-charcoal/50">
        If the lab lets buyers verify a report online, paste its lookup URL and replace the report number in it with
        the literal text <code className="rounded bg-ivory-soft px-1 py-0.5">{"{certId}"}</code>. Ratnavue substitutes
        each gemstone&apos;s own certificate number into that spot automatically. Leave blank if the lab has no
        public lookup tool.
      </p>
      <FieldError>{error ?? undefined}</FieldError>
    </form>
  );
}
