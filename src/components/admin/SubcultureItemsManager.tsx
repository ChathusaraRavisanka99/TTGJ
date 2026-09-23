"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { addCollectionItem, removeCollectionItem, setCollectionItemFeatured, moveCollectionItem } from "@/actions/subculture-items";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Select, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { SubcultureKey } from "@/lib/subculture-collections";

interface Option {
  id: string;
  name: string;
  specs: string;
}

interface CollectionItem {
  id: string;
  label: string;
  featured: boolean;
}

// Mirrors PromotionItemsManager.tsx's picker shape, minus the promotional
// price (this is pure curation, not a discount collection — see
// SubcultureCollectionItem's schema comment) and with a `featured` toggle
// plus Move Up/Down instead. No drag-and-drop library exists anywhere in
// this codebase, so reordering stays a plain button action like every
// other admin list here rather than introducing a new dependency.
export function SubcultureItemsManager({
  collection,
  gemstones,
  jewelry,
  items,
}: {
  collection: SubcultureKey;
  gemstones: Option[];
  jewelry: Option[];
  items: CollectionItem[];
}) {
  const router = useRouter();
  const [itemType, setItemType] = useState<"gemstone" | "jewelry">("gemstone");
  const [itemId, setItemId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = itemType === "gemstone" ? gemstones : jewelry;
  const selected = useMemo(() => options.find((o) => o.id === itemId) ?? null, [options, itemId]);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addCollectionItem({
        collection,
        gemstoneId: itemType === "gemstone" ? itemId || null : null,
        jewelryId: itemType === "jewelry" ? itemId || null : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItemId("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="itemType">Item Type</Label>
          <Select
            id="itemType"
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value as "gemstone" | "jewelry");
              setItemId("");
            }}
            className="w-40"
          >
            <option value="gemstone">Gemstone</option>
            <option value="jewelry">Jewelry</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="item">Item</Label>
          <Select id="item" value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-64">
            <option value="">Select {itemType === "gemstone" ? "a gemstone" : "a jewelry piece"}...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </div>
        <Button type="button" variant="gold" size="sm" disabled={pending || !itemId} onClick={handleAdd}>
          {pending ? "Adding..." : "Add to Collection"}
        </Button>
      </div>
      {selected && <p className="mt-2 text-xs text-charcoal/55">{selected.specs}</p>}
      <FieldError>{error ?? undefined}</FieldError>

      <div className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
        {items.map((item, i) => (
          <CollectionItemRow key={item.id} item={item} isFirst={i === 0} isLast={i === items.length - 1} />
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-charcoal/50">No items in this collection yet.</p>}
      </div>
    </div>
  );
}

function CollectionItemRow({ item, isFirst, isLast }: { item: CollectionItem; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      await moveCollectionItem(item.id, direction);
      router.refresh();
    });
  }

  function handleFeaturedToggle() {
    startTransition(async () => {
      await setCollectionItemFeatured(item.id, !item.featured);
      router.refresh();
    });
  }

  async function handleRemove() {
    if (!(await confirm(`Remove "${item.label}" from this collection?`))) return;
    startTransition(async () => {
      await removeCollectionItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex flex-col">
          <button type="button" onClick={() => handleMove("up")} disabled={pending || isFirst} className="text-charcoal/40 hover:text-charcoal disabled:opacity-25">
            <ChevronUp size={15} />
          </button>
          <button type="button" onClick={() => handleMove("down")} disabled={pending || isLast} className="text-charcoal/40 hover:text-charcoal disabled:opacity-25">
            <ChevronDown size={15} />
          </button>
        </div>
        <p className="truncate text-charcoal">{item.label}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-charcoal/70">
          <input type="checkbox" checked={item.featured} onChange={handleFeaturedToggle} disabled={pending} className="accent-gold" />
          Featured
        </label>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={handleRemove}>Remove</Button>
      </div>
    </div>
  );
}
