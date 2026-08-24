"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ToggleActiveButton({ active, onToggle }: { active: boolean; onToggle: (next: boolean) => Promise<unknown> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="text-xs text-gold underline disabled:opacity-50"
      disabled={pending}
      onClick={() => startTransition(async () => { await onToggle(!active); router.refresh(); })}
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
