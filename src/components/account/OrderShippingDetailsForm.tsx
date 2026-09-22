"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitOrderShippingDetailsAction } from "@/actions/orders";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/** Shown on an order created from an accepted quote/sourcing request
 * (needsShippingDetails: true — see lib/orders.ts) in place of the usual
 * read-only shipping address, since one was never collected for it the
 * way checkout collects one. Same fields as checkout's own shipping step. */
export function OrderShippingDetailsForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await submitOrderShippingDetailsAction(orderId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-charcoal/70">
        This order doesn&apos;t have a shipping address yet — add yours below to continue.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" required />
        </div>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Saving..." : "Save shipping details"}
      </Button>
    </form>
  );
}
