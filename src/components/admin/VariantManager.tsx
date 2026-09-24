"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJewelryVariant, updateJewelryVariant, deleteJewelryVariant } from "@/actions/catalog-admin";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Variant {
  id: string;
  label: string;
  retailPrice: number | null;
  lkrRetailPrice: number | null;
  costPrice: number | null;
  stockStatus: string;
}

const STOCK_LABELS: Record<string, string> = { AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold" };

/** Opt-in style/size variants for one jewelry piece (Size 7, 18-inch
 * chain, ...) — each with its own stock and an optional price override.
 * Only reachable from an already-saved piece's edit page, same as
 * MediaManager/GemstoneLinkManager alongside it. */
export function VariantManager({ jewelryId, variants, lk, staff = false }: { jewelryId: string; variants: Variant[]; lk: boolean; staff?: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const priceField = lk ? "lkrRetailPrice" : "retailPrice";
  const currencySymbol = lk ? "Rs." : "$";

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createJewelryVariant(jewelryId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleUpdate(variantId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateJewelryVariant(variantId, jewelryId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  async function handleDelete(variant: Variant) {
    if (!(await confirm(`Delete "${variant.label}"?`, { confirmLabel: "Delete", danger: true }))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteJewelryVariant(variant.id, jewelryId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {variants.length === 0 && (
        <p className="text-sm text-charcoal/50">No variants yet — this piece sells as a single item.</p>
      )}

      <ul className="space-y-2">
        {variants.map((v) =>
          editingId === v.id ? (
            <li key={v.id} className="rounded-lg border border-border-subtle bg-ivory-soft p-3">
              <form action={(fd) => handleUpdate(v.id, fd)} className="grid gap-3 sm:grid-cols-4 sm:items-end">
                <div>
                  <Label htmlFor={`jv-label-${v.id}`}>Label</Label>
                  <Input id={`jv-label-${v.id}`} name="label" defaultValue={v.label} required />
                </div>
                {!staff && (
                <div>
                  <Label htmlFor={`jv-price-${v.id}`}>Price override</Label>
                  <Input
                    id={`jv-price-${v.id}`}
                    name={priceField}
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(lk ? v.lkrRetailPrice : v.retailPrice) ?? ""}
                    placeholder="Same as piece"
                  />
                </div>
                )}
                {!staff && (
                <div>
                  <Label htmlFor={`jv-cost-${v.id}`}>Cost override</Label>
                  <Input id={`jv-cost-${v.id}`} name="costPrice" type="number" step="0.01" min="0" defaultValue={v.costPrice ?? ""} placeholder="Same as piece" />
                </div>
                )}
                <div>
                  <Label htmlFor={`jv-stock-${v.id}`}>Stock</Label>
                  <Select id={`jv-stock-${v.id}`} name="stockStatus" defaultValue={v.stockStatus}>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </Select>
                </div>
                <div className="flex gap-2 sm:col-span-4">
                  <Button type="submit" size="sm" variant="gold" disabled={pending}>Save</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </form>
            </li>
          ) : (
            <li key={v.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm">
              <span>
                {v.label} — {STOCK_LABELS[v.stockStatus] ?? v.stockStatus}
                {!staff && (lk ? v.lkrRetailPrice : v.retailPrice) != null && ` · ${currencySymbol}${(lk ? v.lkrRetailPrice : v.retailPrice)!.toLocaleString()}`}
              </span>
              <span className="space-x-3">
                <button type="button" className="text-xs text-gold underline" onClick={() => setEditingId(v.id)}>Edit</button>
                {!staff && <button type="button" className="text-xs text-red-700 underline" disabled={pending} onClick={() => handleDelete(v)}>Remove</button>}
              </span>
            </li>
          ),
        )}
      </ul>

      <form action={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <Label htmlFor="jv-new-label">Label</Label>
          <Input id="jv-new-label" name="label" placeholder='e.g. "Size 7"' required />
        </div>
        {!staff && (
        <div>
          <Label htmlFor="jv-new-price">Price override</Label>
          <Input id="jv-new-price" name={priceField} type="number" step="0.01" min="0" placeholder="Same as piece" />
        </div>
        )}
        {!staff && (
        <div>
          <Label htmlFor="jv-new-cost">Cost override</Label>
          <Input id="jv-new-cost" name="costPrice" type="number" step="0.01" min="0" placeholder="Same as piece" />
        </div>
        )}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Adding..." : "Add Variant"}
        </Button>
      </form>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
