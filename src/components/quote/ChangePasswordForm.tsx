"use client";

import { useState } from "react";
import { changePassword } from "@/actions/account";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const result = await changePassword(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      {saved && !error && <p className="text-sm text-green-700">Password changed.</p>}
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Saving..." : "Change Password"}
      </Button>
    </form>
  );
}
