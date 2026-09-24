"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStaffAccount } from "@/actions/staff";
import { Input, Label, Select, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Registers a restricted back-office (STAFF) account directly with a
 * predefined password — same pattern as CreateWholesaleAccountForm.
 * marketScope decides which store's orders they'll be able to see/act on
 * (see User.staffMarketScope's own schema comment); nothing else in the
 * admin back office is ever available to a STAFF account, regardless of
 * scope. */
export function CreateStaffAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await createStaffAccount(formData);
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
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>Create Staff Account</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a staff account">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sa-name">Name</Label>
            <Input id="sa-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="sa-email">Email</Label>
            <Input id="sa-email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="sa-marketScope">Store access</Label>
            <Select id="sa-marketScope" name="marketScope" defaultValue="intl">
              <option value="intl">International only</option>
              <option value="lk">Sri Lanka only</option>
              <option value="both">Both stores</option>
            </Select>
            <FieldHint>Which store&apos;s orders they can see and act on — nothing else in the admin area is ever available to a staff account.</FieldHint>
          </div>
          <div>
            <Label htmlFor="sa-temporaryPassword">Temporary password</Label>
            <Input id="sa-temporaryPassword" name="temporaryPassword" minLength={8} required />
            <p className="mt-1 text-xs text-charcoal/45">
              Emailed to them along with a link to change it — at least 8 characters.
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
