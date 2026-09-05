"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDiscountCode } from "@/actions/discount-codes";
import { Input, Label, Select, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface CustomerOption {
  id: string;
  email: string;
  name: string | null;
}

export function GenerateDiscountCodeForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [scope, setScope] = useState<"SITE_WIDE" | "CUSTOMER">("SITE_WIDE");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await generateDiscountCode({
        amountOff: Number(amount),
        customCode,
        scope,
        assignedUserId: scope === "CUSTOMER" ? assignedUserId : undefined,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated(result.code ?? null);
      setAmount("");
      setCustomCode("");
      setMaxUses("");
      setExpiresAt("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Generate a Code</p>
      <p className="mt-1 text-xs text-charcoal/50">
        Fixed amount off. Site-wide or tied to one customer, an optional use limit, and an optional expiry date.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="amountOff">Amount Off (USD)</Label>
          <Input
            id="amountOff"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="E.g. 50"
          />
        </div>
        <div>
          <Label htmlFor="customCode">Code (optional)</Label>
          <Input
            id="customCode"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="Auto-generated if blank"
            className="font-mono uppercase"
          />
        </div>
        <div>
          <Label htmlFor="maxUses">Max Uses</Label>
          <Input
            id="maxUses"
            type="number"
            step="1"
            min="1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="scope">Who can use it</Label>
          <Select id="scope" value={scope} onChange={(e) => setScope(e.target.value as "SITE_WIDE" | "CUSTOMER")}>
            <option value="SITE_WIDE">Anyone (site-wide)</option>
            <option value="CUSTOMER">One specific customer</option>
          </Select>
        </div>
        {scope === "CUSTOMER" && (
          <div>
            <Label htmlFor="assignedUserId">Customer</Label>
            <Select id="assignedUserId" value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ? `${c.name} (${c.email})` : c.email}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="gold"
          size="sm"
          disabled={pending || !amount || (scope === "CUSTOMER" && !assignedUserId)}
          onClick={handleGenerate}
        >
          {pending ? "Generating..." : "Generate"}
        </Button>
      </div>
      <FieldHint>Letters, numbers, and hyphens only, 3-20 characters — leave blank for a random one.</FieldHint>
      <FieldError>{error ?? undefined}</FieldError>
      {created && (
        <p className="mt-2 text-sm text-green-700">
          Created <span className="font-mono font-medium">{created}</span>.
        </p>
      )}
    </div>
  );
}
