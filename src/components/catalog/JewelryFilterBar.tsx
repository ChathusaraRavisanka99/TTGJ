import { Select, Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PIECE_TYPES, METAL_TYPES } from "@/lib/gem-constants";

interface JewelryFilterBarProps {
  current: Record<string, string | undefined>;
}

export function JewelryFilterBar({ current }: JewelryFilterBarProps) {
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

      <div className="flex items-end gap-3">
        <Button type="submit" variant="primary" className="w-full">Filter</Button>
      </div>
    </form>
  );
}
