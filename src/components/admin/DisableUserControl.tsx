"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserDisabled } from "@/actions/user-status";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Switches an account off (for a while, or for good) or back on. `status` is
 * null while the account is active, otherwise what to show about it. A plain
 * onClick flow throughout — see RevertToUnpaidForm for why confirm() must not
 * be awaited inside a <form action>. */
export function DisableUserControl({ userId, name, status, showBadge = true }: { userId: string; name: string; status: { label: string; reason: string | null } | null; showBadge?: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"temporary" | "permanent">("temporary");
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [tomorrow] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  async function run(action: () => ReturnType<typeof setUserDisabled>, onDone?: () => void) {
    setError(null);
    setPending(true);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone?.();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleEnable() {
    if (!(await confirm(`Switch ${name}'s account back on? They'll be able to sign in again straight away.`, { confirmLabel: "Enable account" }))) return;
    await run(() => setUserDisabled(userId, { mode: "enable" }));
  }

  async function handleDisable() {
    if (mode === "temporary" && !until) {
      setError("Choose the date it switches back on.");
      return;
    }
    await run(
      () => setUserDisabled(userId, mode === "temporary" ? { mode, until: new Date(`${until}T23:59:59`).toISOString(), reason } : { mode, reason }),
      () => {
        setOpen(false);
        setReason("");
        setUntil("");
      },
    );
  }

  return (
    <>
      {status ? (
        <div className="flex flex-wrap items-center gap-2">
          {showBadge && (
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs text-red-700" title={status.reason ?? undefined}>
              {status.label}
            </span>
          )}
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleEnable}>Enable</Button>
          {error && <span className="text-xs text-red-700">{error}</span>}
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Disable…</Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Disable ${name}`}>
        <div className="space-y-4">
          <p className="text-sm text-charcoal/70">A disabled account can&apos;t sign in, and a staff member loses all back-office access straight away.</p>
          <fieldset className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-charcoal/80">
              <input type="radio" name="disable-mode" checked={mode === "temporary"} onChange={() => setMode("temporary")} className="mt-1 accent-gold" />
              <span>
                <span className="font-medium text-charcoal">Temporarily</span>
                <span className="block text-xs text-charcoal/55">Switches back on by itself on the date you pick.</span>
              </span>
            </label>
            {mode === "temporary" && (
              <div className="pl-6">
                <Label htmlFor="disable-until">Back on from</Label>
                <Input id="disable-until" type="date" min={tomorrow} value={until} onChange={(e) => setUntil(e.target.value)} />
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-charcoal/80">
              <input type="radio" name="disable-mode" checked={mode === "permanent"} onChange={() => setMode("permanent")} className="mt-1 accent-gold" />
              <span>
                <span className="font-medium text-charcoal">Permanently</span>
                <span className="block text-xs text-charcoal/55">Stays off until an admin enables it again.</span>
              </span>
            </label>
          </fieldset>
          <div>
            <Label htmlFor="disable-reason">Reason (only visible to admins)</Label>
            <Textarea id="disable-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDisable}>
              {pending ? "Disabling..." : "Disable account"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
