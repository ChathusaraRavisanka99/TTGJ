"use client";

import { useState, useTransition } from "react";
import { initiateRetailCheckout } from "@/actions/checkout";
import type { PayhereCheckoutFields } from "@/lib/payhere";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

// A country select would need a full ISO list — a plain text field here
// instead, matched case-insensitively against each ShippingZone's
// countries and against "Sri Lanka" for the domestic/VAT check (see
// lib/checkout.ts's isSriLanka). Good enough for the countries this
// business actually ships to today; a real dropdown is a easy follow-up
// once the shipping zone list is finalized.
export function CheckoutForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await initiateRetailCheckout(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      submitToPayhere(result.checkoutUrl, result.fields);
    });
  }

  function submitToPayhere(checkoutUrl: string, fields: PayhereCheckoutFields) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutUrl;
    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required autoComplete="tel" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" required autoComplete="street-address" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required autoComplete="address-level2" />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" required autoComplete="country-name" placeholder="e.g. Sri Lanka" />
        </div>
      </div>

      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
        {pending ? "Preparing payment..." : "Continue to Payment"}
      </Button>
      <p className="text-center text-xs text-charcoal/45">You&apos;ll be redirected to PayHere to complete payment securely.</p>
    </form>
  );
}
