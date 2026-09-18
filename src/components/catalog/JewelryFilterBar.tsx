import { Input, Label } from "@/components/ui/Field";
import { Button, HardLinkButton } from "@/components/ui/Button";
import { PIECE_TYPES, METAL_TYPES } from "@/lib/gem-constants";
import { cn } from "@/lib/utils";

interface JewelryFilterBarProps {
  current: Record<string, string | string[] | undefined>;
}

function toSet(value: string | string[] | undefined): Set<string> {
  if (value === undefined) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Same collapsible, no-JS-needed checkbox group as GemFilterBar — see its
// own comment for why <details>/<summary> rather than a client component.
function CheckboxGroup({
  label,
  name,
  options,
  active,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  active: Set<string>;
}) {
  return (
    <details className="group rounded-lg border border-border-subtle p-3" open={active.size > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-wide text-charcoal/70">
        {label}
        {active.size > 0 && <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] text-charcoal">{active.size}</span>}
        <span className="ml-auto text-charcoal/40 group-open:hidden">+</span>
        <span className="hidden text-charcoal/40 group-open:inline">−</span>
      </summary>
      <div className="mt-3 flex flex-col gap-1.5">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-charcoal/75">
            <input type="checkbox" name={name} value={opt.value} defaultChecked={active.has(opt.value)} className="accent-gold" />
            {opt.label}
          </label>
        ))}
      </div>
    </details>
  );
}

export function JewelryFilterBar({ current }: JewelryFilterBarProps) {
  // `page` alone (no real filter set) shouldn't count as "something to
  // clear" — it'd make the button appear just from paging through an
  // unfiltered catalog, which has nothing to do with what it's for.
  const hasActiveFilters = Object.entries(current).some(([key, value]) => {
    if (key === "page") return false;
    return Array.isArray(value) ? value.length > 0 : !!value;
  });

  return (
    <form method="get" className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={first(current.q)} placeholder="Ring, necklace, sapphire..." />
        </div>

        <CheckboxGroup
          label="Piece type"
          name="pieceType"
          active={toSet(current.pieceType)}
          options={PIECE_TYPES.map((p) => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))}
        />
        <CheckboxGroup label="Metal" name="metalType" active={toSet(current.metalType)} options={METAL_TYPES.map((m) => ({ value: m.value, label: m.label }))} />

        <div className="rounded-lg border border-border-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/70">Price ($)</p>
          <div className="mt-3 flex items-center gap-2">
            <Input name="minPrice" type="number" min={0} step="1" placeholder="Min" defaultValue={first(current.minPrice)} className="text-sm" />
            <span className="text-charcoal/40">–</span>
            <Input name="maxPrice" type="number" min={0} step="1" placeholder="Max" defaultValue={first(current.maxPrice)} className="text-sm" />
          </div>
        </div>

        <div>
          <Label htmlFor="sort">Sort by</Label>
          <select
            id="sort"
            name="sort"
            defaultValue={first(current.sort) ?? "newest"}
            className="w-full rounded-md border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="newest">Newest</option>
            <option value="az">Alphabetical</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-charcoal/75">
            <input type="checkbox" name="inStockOnly" value="1" defaultChecked={first(current.inStockOnly) === "1"} className="accent-gold" />
            In stock only
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal/75">
            <input type="checkbox" name="promotional" value="1" defaultChecked={first(current.promotional) === "1"} className="accent-gold" />
            On promotion
          </label>
        </div>
      </div>

      <div className={cn("mt-5 flex gap-3", hasActiveFilters ? "" : "sm:w-56")}>
        <Button type="submit" variant="primary" className="flex-1 sm:flex-none sm:px-10">Filter</Button>
        {hasActiveFilters && (
          <HardLinkButton href="/jewelry" variant="outline" className="flex-1 sm:flex-none sm:px-10">Clear Filters</HardLinkButton>
        )}
      </div>
    </form>
  );
}
