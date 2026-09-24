"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStaffAccount } from "@/actions/staff";
import { Input, Label, Select, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { STAFF_AREAS, STAFF_AREA_LABELS } from "@/lib/staff-permissions";

/** Registers a restricted back-office (STAFF) account directly with a
 * predefined password — same pattern as CreateWholesaleAccountForm.
 * The permission checkboxes pick which areas they get; marketScope decides which store
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
            <FieldHint>Which store&apos;s orders, gems, jewelry and reviews they can see and change.</FieldHint>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-charcoal">What they can manage</legend>
            <div className="space-y-2">
              {STAFF_AREAS.map((area) => (
                <label key={area} className="flex items-start gap-2 text-sm text-charcoal/80">
                  <input type="checkbox" name="permissions" value={area} defaultChecked={area === "orders"} className="mt-1 accent-gold" />
                  <span>
                    <span className="font-medium text-charcoal">{STAFF_AREA_LABELS[area].label}</span>
                    <span className="block text-xs text-charcoal/55">{STAFF_AREA_LABELS[area].description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
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
