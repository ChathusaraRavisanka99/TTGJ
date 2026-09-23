"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkSetCatalogPublished, type CatalogKind } from "@/actions/catalog-admin";
import { Button } from "@/components/ui/Button";

interface SelectionContextValue {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("CatalogRowCheckbox/CatalogBulkToolbar must be used inside CatalogBulkSelectionProvider");
  return ctx;
}

/** Wraps an admin catalog table (gems or jewelry) to add bulk-select —
 * one shared selection Set, provided via context so a server-rendered
 * <table>'s row checkboxes and the toolbar above it can both reach it
 * without lifting the whole table into a client component. */
export function CatalogBulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const value = useMemo(() => ({ selected, toggle, clear }), [selected, toggle, clear]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function CatalogRowCheckbox({ id }: { id: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      aria-label="Select row"
      className="h-4 w-4 rounded border-border-subtle accent-charcoal"
    />
  );
}

/** "N selected" + Publish/Unpublish, shown only once something's checked.
 * Doesn't touch isFeatured/stockStatus — those already have their own
 * per-row controls; this is specifically for clearing a batch of sold or
 * otherwise-no-longer-wanted items off the public storefront at once. */
export function CatalogBulkToolbar({ kind }: { kind: CatalogKind }) {
  const { selected, clear } = useSelection();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (selected.size === 0) return null;

  async function apply(isPublished: boolean) {
    setError(null);
    setPending(true);
    try {
      const result = await bulkSetCatalogPublished(kind, [...selected], isPublished);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clear();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5">
      <p className="text-sm text-charcoal">{selected.size} selected</p>
      <Button type="button" size="sm" variant="gold" disabled={pending} onClick={() => apply(false)}>
        {pending ? "Working..." : "Hide from storefront"}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => apply(true)}>
        {pending ? "Working..." : "Publish"}
      </Button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
