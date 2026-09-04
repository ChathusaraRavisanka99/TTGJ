"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteRequest, updateSourcingRequest } from "@/actions/admin-requests";
import { Select, Textarea, Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"];

// yyyy-mm-dd for an <input type="date">'s defaultValue/value.
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function QuoteStatusForm({
  id,
  kind,
  currentStatus,
  currentAdminNotes,
  currentQuotedPrice,
  currentQuoteValidUntil,
}: {
  id: string;
  kind: "quote" | "sourcing";
  currentStatus: string;
  currentAdminNotes: string;
  currentQuotedPrice?: number | null;
  currentQuoteValidUntil?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes);
  const [price, setPrice] = useState(currentQuotedPrice != null ? String(currentQuotedPrice) : "");
  const [validUntil, setValidUntil] = useState(toDateInputValue(currentQuoteValidUntil));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const priceArg = price.trim() === "" ? undefined : Number(price);
      const validUntilArg = validUntil === toDateInputValue(currentQuoteValidUntil) ? undefined : validUntil || null;
      const result =
        kind === "quote"
          ? await updateQuoteRequest(id, status as never, adminNotes, priceArg, validUntilArg)
          : await updateSourcingRequest(id, status as never, adminNotes, priceArg, validUntilArg);
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Manage Status</p>
      <div className="mt-4">
        <Label htmlFor="status">Status</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </Select>
      </div>

      <div className="mt-4">
        <Label htmlFor="quotedPrice">Quoted Price (USD)</Label>
        <Input
          id="quotedPrice"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="E.g. 4200"
        />
        <p className="mt-1 text-xs text-charcoal/45">
          Required before this can be marked Quoted or Accepted — it&apos;s what the printable
          {kind === "quote" ? " quote and any resulting invoice show" : " cart line item shows once accepted"}.
        </p>
      </div>
      <div className="mt-4">
        <Label htmlFor="quoteValidUntil">Valid Until (optional)</Label>
        <Input id="quoteValidUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      </div>

      <div className="mt-4">
        <Label htmlFor="adminNotes">Notes to Customer (shown on their account as &quot;From Ratnavue&quot;)</Label>
        <Textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>

      <Button className="mt-4" variant="gold" disabled={pending} onClick={handleSave}>
        {pending ? "Saving..." : "Save"}
      </Button>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
