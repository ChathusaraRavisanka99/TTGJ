"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { submitSourcingRequest } from "@/actions/quotes";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldHint } from "@/components/ui/Field";

const initialState: ActionResult = { ok: false, error: "" };

export function SourcingForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitSourcingRequest(formData),
    initialState
  );

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <CircleCheck className="mt-0.5 shrink-0 text-emerald-700" size={20} />
        <div>
          <p className="text-sm font-medium text-emerald-900">Sourcing request submitted</p>
          <p className="mt-1 text-sm text-emerald-800/80">
            Our sourcing team will reach out by email once we&apos;ve found a match.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="mineralDescription">What are you looking for?</Label>
        <Input id="mineralDescription" name="mineralDescription" required placeholder="E.g. Ceylon blue sapphire" />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <Label htmlFor="approxSize">Approximate size</Label>
          <Input id="approxSize" name="approxSize" placeholder="E.g. 2-3 ct" />
        </div>
        <div>
          <Label htmlFor="approxCut">Approximate cut</Label>
          <Input id="approxCut" name="approxCut" placeholder="E.g. Oval" />
        </div>
        <div>
          <Label htmlFor="approxColor">Approximate colour</Label>
          <Input id="approxColor" name="approxColor" placeholder="E.g. Cornflower blue" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional notes</Label>
        <Textarea id="notes" name="notes" placeholder="Anything else that helps us source the right stone..." />
        <FieldHint>Please don&apos;t include a specific offer price — we&apos;ll quote you once we&apos;ve sourced a match.</FieldHint>
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <Button type="submit" variant="gold" size="lg" disabled={pending}>
        {pending ? "Submitting..." : "Submit Sourcing Request"}
      </Button>
    </form>
  );
}
