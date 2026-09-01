"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJewelry, updateJewelry, deleteJewelry } from "@/actions/catalog-admin";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PIECE_TYPES, METAL_TYPES } from "@/lib/gem-constants";

interface JewelryFormProps {
  initial?: {
    id: string;
    name: string;
    description: string | null;
    pieceType: string;
    metalType: string;
    metalPurity: string | null;
    metalWeightG: number | null;
    ringSize: string | null;
    styleTags: string[];
    price: number | null;
    showPrice: boolean;
    stockStatus: string;
    isPublished: boolean;
    isFeatured: boolean;
  };
}

export function JewelryForm({ initial }: JewelryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = initial ? await updateJewelry(initial.id, formData) : await createJewelry(formData);
    setPending(false);
    if (result && !result.ok) {
      setError(result.error);
    } else if (initial) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.name}"? This cannot be undone.`)) return;
    await deleteJewelry(initial.id);
    router.push("/admin/jewelry");
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-8">
      <section className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={initial?.name} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pieceType">Piece Type</Label>
          <Select id="pieceType" name="pieceType" defaultValue={initial?.pieceType ?? "RING"}>
            {PIECE_TYPES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="metalType">Metal Type</Label>
          <Select id="metalType" name="metalType" defaultValue={initial?.metalType ?? "GOLD"}>
            {METAL_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="metalPurity">Metal Purity</Label>
          <Input id="metalPurity" name="metalPurity" defaultValue={initial?.metalPurity ?? ""} placeholder="E.g. 18K, 950" />
        </div>
        <div>
          <Label htmlFor="metalWeightG">Metal Weight (g)</Label>
          <Input id="metalWeightG" name="metalWeightG" type="number" step="0.01" defaultValue={initial?.metalWeightG ?? ""} />
        </div>
        <div>
          <Label htmlFor="ringSize">Ring Size / Adjustability</Label>
          <Input id="ringSize" name="ringSize" defaultValue={initial?.ringSize ?? ""} />
        </div>
        <div>
          <Label htmlFor="styleTags">Style Tags (comma-separated)</Label>
          <Input id="styleTags" name="styleTags" defaultValue={initial?.styleTags?.join(", ") ?? ""} placeholder="Bridal, Everyday, Statement" />
        </div>
        <div>
          <Label htmlFor="stockStatus">Stock Status</Label>
          <Select id="stockStatus" name="stockStatus" defaultValue={initial?.stockStatus ?? "AVAILABLE"}>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={initial?.price ?? ""} placeholder="E.g. 6800" />
          <p className="mt-1 text-xs text-charcoal/45">
            Used as the quoting reference either way. Only shown to customers if &ldquo;Show price publicly&rdquo; is
            checked.
          </p>
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-charcoal/75">
          <input type="hidden" name="showPrice" value="false" />
          <input type="checkbox" name="showPrice" value="true" defaultChecked={initial?.showPrice ?? false} className="accent-gold" />
          Show price publicly (otherwise this piece stays quote-only)
        </label>
      </section>

      <label className="flex items-center gap-2 text-sm text-charcoal/75">
        <input type="hidden" name="isPublished" value="false" />
        <input type="checkbox" name="isPublished" value="true" defaultChecked={initial?.isPublished ?? true} className="accent-gold" />
        Published (visible in the public catalog)
      </label>

      <label className="flex items-center gap-2 text-sm text-charcoal/75">
        <input type="hidden" name="isFeatured" value="false" />
        <input type="checkbox" name="isFeatured" value="true" defaultChecked={initial?.isFeatured ?? false} className="accent-gold" />
        Featured (shown in the homepage&apos;s Featured Jewelry section)
      </label>

      <FieldError>{error ?? undefined}</FieldError>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Saving..." : initial ? "Save Changes" : "Create Jewelry Piece"}
        </Button>
        {initial && (
          <Button type="button" variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
