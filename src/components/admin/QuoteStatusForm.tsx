"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteRequest, updateSourcingRequest } from "@/actions/admin-requests";
import { Select, Textarea, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"];

export function QuoteStatusForm({ id, kind, currentStatus, currentAdminNotes }: { id: string; kind: "quote" | "sourcing"; currentStatus: string; currentAdminNotes: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes);
  const [pending, startTransition] = useTransition();

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
        <Label htmlFor="adminNotes">Notes to Customer (shown on their account as &quot;From Ratnavue&quot;)</Label>
        <Textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>
      <Button
        className="mt-4"
        variant="gold"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (kind === "quote") await updateQuoteRequest(id, status as never, adminNotes);
            else await updateSourcingRequest(id, status as never, adminNotes);
            router.refresh();
          })
        }
      >
        {pending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
