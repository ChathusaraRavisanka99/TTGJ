"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

// Quick per-row curation control for the homepage's Featured Gemstones /
// Featured Jewelry sections — a filled gold star toggles a single item in
// or out without opening its full edit form. Whether the section itself is
// shown at all is a separate switch, set on /admin/content/home.
export function ToggleFeaturedButton({ featured, onToggle }: { featured: boolean; onToggle: (next: boolean) => Promise<unknown> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={featured ? "Remove from homepage Featured section" : "Add to homepage Featured section"}
      disabled={pending}
      onClick={() => startTransition(async () => { await onToggle(!featured); router.refresh(); })}
      className="rounded p-1 text-charcoal/40 transition-colors hover:bg-charcoal/5 hover:text-gold disabled:opacity-50"
    >
      <Star size={16} className={featured ? "fill-gold text-gold" : ""} />
    </button>
  );
}
