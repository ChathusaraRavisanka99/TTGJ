"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GemVisualizer } from "@/components/gem-visualizer/GemVisualizer";
import { hueAtPercent, percentAtHue, resolveGemColor } from "@/components/gem-visualizer/color";
import { createGemstone, updateGemstone, deleteGemstone } from "@/actions/catalog-admin";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Option {
  id: string;
  name: string;
  slug?: string;
  hueMin?: number;
  hueMax?: number;
  category?: string;
}

interface GemstoneFormProps {
  minerals: Option[];
  cuts: Option[];
  clarityGrades: Option[];
  treatments: Option[];
  origins: Option[];
  certificationLabs: Option[];
  initial?: {
    id: string;
    name: string;
    description: string | null;
    mineralId: string;
    variety: string | null;
    cutId: string;
    caratWeight: number;
    lengthMm: number | null;
    widthMm: number | null;
    depthMm: number | null;
    colorHue: number;
    colorSaturation: number;
    colorLightness: number;
    colorLabel: string | null;
    clarityGradeId: string;
    treatmentId: string;
    originId: string;
    symmetryNotes: string | null;
    polishNotes: string | null;
    certLabId: string | null;
    certReportNumber: string | null;
    certFileUrl: string | null;
    price: number | null;
    showPrice: boolean;
    stockStatus: string;
    isPublished: boolean;
    isFeatured: boolean;
  };
}

export function GemstoneForm({ minerals, cuts, clarityGrades, treatments, origins, certificationLabs, initial }: GemstoneFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [mineralId, setMineralId] = useState(initial?.mineralId ?? minerals[0]?.id ?? "");
  const [cutId, setCutId] = useState(initial?.cutId ?? cuts[0]?.id ?? "");
  const [caratWeight, setCaratWeight] = useState(initial?.caratWeight ?? 1);
  const [huePercent, setHuePercent] = useState(() => {
    const m = minerals.find((x) => x.id === (initial?.mineralId ?? minerals[0]?.id));
    return m ? percentAtHue(m.hueMin ?? 0, m.hueMax ?? 360, initial?.colorHue ?? (m.hueMin ?? 0)) : 50;
  });
  const [darkness, setDarkness] = useState(initial?.colorLightness ?? 45);
  const [clarityId, setClarityId] = useState(initial?.clarityGradeId ?? clarityGrades[0]?.id ?? "");

  const mineral = minerals.find((m) => m.id === mineralId);
  const cut = cuts.find((c) => c.id === cutId);
  const clarity = clarityGrades.find((c) => c.id === clarityId);
  const hue = mineral ? hueAtPercent(mineral.hueMin ?? 0, mineral.hueMax ?? 360, huePercent) : 0;

  function handleMineralChange(id: string) {
    const next = minerals.find((m) => m.id === id);
    setMineralId(id);
    if (next) setHuePercent(percentAtHue(next.hueMin ?? 0, next.hueMax ?? 360, hue));
  }

  const gradientStops = useMemo(() => {
    if (!mineral) return "";
    const steps = 12;
    const stops = Array.from({ length: steps + 1 }, (_, i) => {
      const p = (i / steps) * 100;
      const h = hueAtPercent(mineral.hueMin ?? 0, mineral.hueMax ?? 360, p);
      return resolveGemColor(h, darkness).base;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [mineral, darkness]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = initial ? await updateGemstone(initial.id, formData) : await createGemstone(formData);
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
    await deleteGemstone(initial.id);
    router.push("/admin/gems");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div>
        <div className="rounded-xl border border-border-subtle bg-gradient-to-b from-ivory-soft to-ivory p-6">
          {cut && (
            <GemVisualizer
              cutSlug={cut.slug ?? "round-brilliant"}
              hue={hue}
              darkness={darkness}
              claritySlug={clarity?.slug ?? "eye-clean"}
              caratWeight={caratWeight}
              seedKey="admin-preview"
              className="aspect-square w-full"
            />
          )}
        </div>
        <p className="mt-2 text-center text-xs text-charcoal/45">Live preview from the fields on the right.</p>
      </div>

      <form action={handleSubmit} className="space-y-8">
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
            <Label htmlFor="mineralId">Mineral</Label>
            <Select id="mineralId" name="mineralId" value={mineralId} onChange={(e) => handleMineralChange(e.target.value)}>
              {minerals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" name="variety" defaultValue={initial?.variety ?? ""} placeholder="E.g. Padparadscha" />
          </div>
          <div>
            <Label htmlFor="cutId">Cut</Label>
            <Select id="cutId" name="cutId" value={cutId} onChange={(e) => setCutId(e.target.value)}>
              <optgroup label="Faceted">
                {cuts.filter((c) => c.category === "FACETED").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Cabochon">
                {cuts.filter((c) => c.category === "CABOCHON").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            </Select>
          </div>
          <div>
            <Label htmlFor="caratWeight">Carat Weight</Label>
            <Input
              id="caratWeight"
              name="caratWeight"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={caratWeight}
              onChange={(e) => setCaratWeight(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="lengthMm">Length (mm)</Label>
            <Input id="lengthMm" name="lengthMm" type="number" step="0.01" defaultValue={initial?.lengthMm ?? ""} />
          </div>
          <div>
            <Label htmlFor="widthMm">Width (mm)</Label>
            <Input id="widthMm" name="widthMm" type="number" step="0.01" defaultValue={initial?.widthMm ?? ""} />
          </div>
          <div>
            <Label htmlFor="depthMm">Depth (mm)</Label>
            <Input id="depthMm" name="depthMm" type="number" step="0.01" defaultValue={initial?.depthMm ?? ""} />
          </div>
          <div>
            <Label htmlFor="colorLabel">Colour Label</Label>
            <Input id="colorLabel" name="colorLabel" defaultValue={initial?.colorLabel ?? ""} placeholder="E.g. Royal Blue" />
          </div>
        </section>

        <section>
          <Label>Colour (constrained to {mineral?.name})</Label>
          <input type="range" min={0} max={100} value={huePercent} onChange={(e) => setHuePercent(Number(e.target.value))} className="w-full" />
          <div className="h-2 rounded-full" style={{ background: gradientStops }} />
          <input type="hidden" name="colorHue" value={hue} />
          <input type="hidden" name="colorSaturation" value={72} />

          <div className="mt-4 flex items-center justify-between">
            <Label className="mb-0">Darkness / Tone</Label>
            <span className="text-sm text-charcoal/60">{darkness}</span>
          </div>
          <input type="range" min={0} max={100} name="colorLightness" value={darkness} onChange={(e) => setDarkness(Number(e.target.value))} className="w-full" />
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="clarityGradeId">Clarity</Label>
            <Select id="clarityGradeId" name="clarityGradeId" value={clarityId} onChange={(e) => setClarityId(e.target.value)}>
              {clarityGrades.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="treatmentId">Treatment</Label>
            <Select id="treatmentId" name="treatmentId" defaultValue={initial?.treatmentId ?? treatments[0]?.id}>
              {treatments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="originId">Origin</Label>
            <Select id="originId" name="originId" defaultValue={initial?.originId ?? origins[0]?.id}>
              {origins.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="stockStatus">Stock Status</Label>
            <Select id="stockStatus" name="stockStatus" defaultValue={initial?.stockStatus ?? "AVAILABLE"}>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
            </Select>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="symmetryNotes">Symmetry / Polish Notes</Label>
            <Input id="symmetryNotes" name="symmetryNotes" defaultValue={initial?.symmetryNotes ?? ""} />
          </div>
          <div>
            <Label htmlFor="polishNotes">Polish Notes</Label>
            <Input id="polishNotes" name="polishNotes" defaultValue={initial?.polishNotes ?? ""} />
          </div>
          <div>
            <Label htmlFor="certLabId">Certification Lab</Label>
            <Select id="certLabId" name="certLabId" defaultValue={initial?.certLabId ?? ""}>
              <option value="">None</option>
              {certificationLabs.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
            </Select>
            <p className="mt-1 text-xs text-charcoal/45">
              Manage the list (and each lab&apos;s verification URL) under Master Data → Certification Labs.
            </p>
          </div>
          <div>
            <Label htmlFor="certReportNumber">Certificate Report #</Label>
            <Input id="certReportNumber" name="certReportNumber" defaultValue={initial?.certReportNumber ?? ""} />
            <p className="mt-1 text-xs text-charcoal/45">
              If the selected lab has a verification URL configured, this number is substituted into it to build a
              &ldquo;Verify Certificate&rdquo; link on the public gem page.
            </p>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Price (USD)</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={initial?.price ?? ""} placeholder="E.g. 4200" />
            <p className="mt-1 text-xs text-charcoal/45">
              Used as the quoting reference either way. Only shown to customers if &ldquo;Show price publicly&rdquo;
              is checked.
            </p>
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-charcoal/75">
            <input type="hidden" name="showPrice" value="false" />
            <input type="checkbox" name="showPrice" value="true" defaultChecked={initial?.showPrice ?? false} className="accent-gold" />
            Show price publicly (otherwise this item stays quote-only)
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
          Featured (shown in the homepage&apos;s Featured Gemstones section)
        </label>

        <FieldError>{error ?? undefined}</FieldError>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="gold" disabled={pending}>
            {pending ? "Saving..." : initial ? "Save Changes" : "Create Gemstone"}
          </Button>
          {initial && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
