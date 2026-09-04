"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteDiscountCode } from "@/actions/discount-codes";

export function DeleteDiscountCodeButton({ id, code }: { id: string; code: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete unused code ${code}? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteDiscountCode(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      title="Delete unused code"
      disabled={pending}
      onClick={handleDelete}
      className="text-charcoal/40 transition-colors hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
