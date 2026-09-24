"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteBundle } from "@/actions/bundles";
import { useConfirm } from "@/components/providers/ConfirmProvider";

export function DeleteBundleButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete() {
    if (!(await confirm(`Delete "${name}"? This can't be undone.`, { confirmLabel: "Delete", danger: true }))) return;
    startTransition(async () => {
      await deleteBundle(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      title="Delete bundle"
      disabled={pending}
      onClick={handleDelete}
      className="text-charcoal/40 transition-colors hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
