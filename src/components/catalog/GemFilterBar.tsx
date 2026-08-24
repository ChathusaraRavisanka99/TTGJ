import { Select, Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface GemFilterBarProps {
  minerals: { slug: string; name: string }[];
  cuts: { slug: string; name: string }[];
  clarityGrades: { slug: string; name: string }[];
  treatments: { slug: string; name: string }[];
  origins: { slug: string; name: string }[];
  current: Record<string, string | undefined>;
}

export function GemFilterBar({ minerals, cuts, clarityGrades, treatments, origins, current }: GemFilterBarProps) {
  return (
    <form method="get" className="grid grid-cols-2 gap-4 rounded-xl border border-border-subtle bg-surface p-5 sm:grid-cols-3 lg:grid-cols-5">
      <div className="col-span-2 sm:col-span-3 lg:col-span-5">
        <Label htmlFor="q">Search</Label>
        <Input id="q" name="q" defaultValue={current.q} placeholder="Sapphire, ruby, oval cut..." />
      </div>

      <div>
        <Label htmlFor="mineral">Mineral</Label>
        <Select id="mineral" name="mineral" defaultValue={current.mineral ?? ""}>
          <option value="">All minerals</option>
          {minerals.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="cut">Cut</Label>
        <Select id="cut" name="cut" defaultValue={current.cut ?? ""}>
          <option value="">All cuts</option>
          {cuts.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="clarity">Clarity</Label>
        <Select id="clarity" name="clarity" defaultValue={current.clarity ?? ""}>
          <option value="">All clarities</option>
          {clarityGrades.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="treatment">Treatment</Label>
        <Select id="treatment" name="treatment" defaultValue={current.treatment ?? ""}>
          <option value="">All treatments</option>
          {treatments.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="origin">Origin</Label>
        <Select id="origin" name="origin" defaultValue={current.origin ?? ""}>
          <option value="">All origins</option>
          {origins.map((o) => (
            <option key={o.slug} value={o.slug}>{o.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="minCarat">Min carat</Label>
        <Input id="minCarat" name="minCarat" type="number" step="0.1" min={0} defaultValue={current.minCarat} />
      </div>

      <div>
        <Label htmlFor="maxCarat">Max carat</Label>
        <Input id="maxCarat" name="maxCarat" type="number" step="0.1" min={0} defaultValue={current.maxCarat} />
      </div>

      <div>
        <Label htmlFor="sort">Sort by</Label>
        <Select id="sort" name="sort" defaultValue={current.sort ?? "newest"}>
          <option value="newest">Newest</option>
          <option value="carat">Carat weight</option>
          <option value="az">Alphabetical</option>
        </Select>
      </div>

      <label className="flex items-end gap-2 pb-2.5 text-sm text-charcoal/75">
        <input type="checkbox" name="inStockOnly" value="1" defaultChecked={current.inStockOnly === "1"} className="accent-gold" />
        In stock only
      </label>

      <div className="col-span-2 flex items-end gap-3 sm:col-span-1">
        <Button type="submit" variant="primary" className="w-full">Filter</Button>
      </div>
    </form>
  );
}
