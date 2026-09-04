import { Select, Input, Label } from "@/components/ui/Field";
import { Button, HardLinkButton } from "@/components/ui/Button";
import { PIECE_TYPES, METAL_TYPES } from "@/lib/gem-constants";
import { cn } from "@/lib/utils";

interface JewelryFilterBarProps {
  current: Record<string, string | undefined>;
}

export function JewelryFilterBar({ current }: JewelryFilterBarProps) {
  // `page` alone (no real filter set) shouldn't count as "something to
  // clear" — it'd make the button appear just from paging through an
  // unfiltered catalog, which has nothing to do with what it's for.
  const hasActiveFilters = Object.entries(current).some(([key, value]) => key !== "page" && !!value);

  return (
    <form method="get" className="grid grid-cols-2 gap-4 rounded-xl border border-border-subtle bg-surface p-5 sm:grid-cols-3 lg:grid-cols-5">
      <div className="col-span-2 sm:col-span-3 lg:col-span-5">
        <Label htmlFor="q">Search</Label>
        <Input id="q" name="q" defaultValue={current.q} placeholder="Ring, necklace, sapphire..." />
      </div>

      <div>
        <Label htmlFor="pieceType">Piece type</Label>
        <Select id="pieceType" name="pieceType" defaultValue={current.pieceType ?? ""}>
          <option value="">All types</option>
          {PIECE_TYPES.map((p) => (
            <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="metalType">Metal</Label>
        <Select id="metalType" name="metalType" defaultValue={current.metalType ?? ""}>
          <option value="">All metals</option>
          {METAL_TYPES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="sort">Sort by</Label>
        <Select id="sort" name="sort" defaultValue={current.sort ?? "newest"}>
          <option value="newest">Newest</option>
          <option value="az">Alphabetical</option>
        </Select>
      </div>

      <label className="flex items-end gap-2 pb-2.5 text-sm text-charcoal/75">
        <input type="checkbox" name="inStockOnly" value="1" defaultChecked={current.inStockOnly === "1"} className="accent-gold" />
        In stock only
      </label>

      <label className="flex items-end gap-2 pb-2.5 text-sm text-charcoal/75">
        <input type="checkbox" name="promotional" value="1" defaultChecked={current.promotional === "1"} className="accent-gold" />
        On promotion
      </label>

      <div className={cn("flex items-end gap-3", hasActiveFilters && "sm:col-span-2")}>
        <Button type="submit" variant="primary" className={hasActiveFilters ? "flex-1" : "w-full"}>Filter</Button>
        {hasActiveFilters && (
          <HardLinkButton href="/jewelry" variant="outline" className="flex-1">Clear Filters</HardLinkButton>
        )}
      </div>
    </form>
  );
}
