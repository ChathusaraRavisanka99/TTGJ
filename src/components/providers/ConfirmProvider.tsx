"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
  /** Defaults to "Confirm"/"Cancel" — override for a more specific pair,
   * e.g. { confirmLabel: "Delete", danger: true }. */
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red) rather than the
   * default gold — for delete/remove actions specifically. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Replaces the browser's native window.confirm()/confirm() across the app
 * (admin delete/remove buttons, the wholesale cart submit button, etc.)
 * with a real dialog matching the site's own design — a native confirm()
 * is unstyled, blocks the whole tab including any in-flight async work,
 * and on some mobile browsers is suppressed/auto-dismissed entirely,
 * silently skipping the confirmation.
 *
 * Mounted once at the root (see app/layout.tsx) so any component can call
 * useConfirm() and `await` a yes/no answer, same call shape as the native
 * function it replaces (`if (!(await confirm(msg))) return;`) — every
 * call site only needed to add `await` and, where it wasn't already, make
 * its enclosing handler async.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Guards against the dialog closing (Escape, backdrop click) resolving
  // twice if a button click's resolve already ran.
  const settledRef = useRef(false);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      settledRef.current = false;
      setPending({ message, resolve, ...options });
    });
  }, []);

  function settle(value: boolean) {
    if (settledRef.current) return;
    settledRef.current = true;
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!pending} onClose={() => settle(false)} title={pending?.title ?? "Are you sure?"}>
        <p className="text-sm text-charcoal/80">{pending?.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => settle(false)}>
            {pending?.cancelLabel ?? "Cancel"}
          </Button>
          <Button type="button" variant={pending?.danger ? "destructive" : "gold"} onClick={() => settle(true)}>
            {pending?.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
