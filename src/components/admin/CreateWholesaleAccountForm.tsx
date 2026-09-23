"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWholesaleAccount } from "@/actions/wholesale";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Registers a wholesale customer directly with a predefined password,
 * rather than waiting for them to self-register and apply — for a
 * business the admin is onboarding by hand. Created already APPROVED,
 * same as approving a self-submitted application does. */
export function CreateWholesaleAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await createWholesaleAccount(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>Register Wholesale Account</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Register a wholesale account">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="wa-name">Contact name</Label>
            <Input id="wa-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="wa-email">Email</Label>
            <Input id="wa-email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="wa-businessName">Business name</Label>
            <Input id="wa-businessName" name="businessName" required />
          </div>
          <div>
            <Label htmlFor="wa-businessRegNo">Business registration number</Label>
            <Input id="wa-businessRegNo" name="businessRegNo" required />
          </div>
          <div>
            <Label htmlFor="wa-temporaryPassword">Temporary password</Label>
            <Input id="wa-temporaryPassword" name="temporaryPassword" minLength={8} required />
            <p className="mt-1 text-xs text-charcoal/45">
              Emailed to the customer along with a link to change it — at least 8 characters.
            </p>
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
