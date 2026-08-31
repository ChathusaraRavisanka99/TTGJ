"use client";

import { useMemo, useState } from "react";
import { GemVisualizer } from "@/components/gem-visualizer/GemVisualizer";
import { resolveGemColor, hueAtPercent, percentAtHue } from "@/components/gem-visualizer/color";
import { estimateDimensionsMm } from "@/components/gem-visualizer/size";
import { Label, Select } from "@/components/ui/Field";
import { QuoteRequestPanel } from "@/components/quote/QuoteRequestPanel";
import type { ConfiguredSpec } from "@/lib/validation/quote";

interface Mineral {
  id: string;
  name: string;
  slug: string;
  hueMin: number;
  hueMax: number;
}

interface Cut {
  id: string;
  name: string;
  slug: string;
  category: "FACETED" | "CABOCHON";
}

interface ClarityGrade {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface GemConfiguratorClientProps {
  minerals: Mineral[];
  cuts: Cut[];
  clarityGrades: ClarityGrade[];
  isAuthenticated: boolean;
}

export function GemConfiguratorClient({ minerals, cuts, clarityGrades, isAuthenticated }: GemConfiguratorClientProps) {
  const [mineralId, setMineralId] = useState(minerals[0]?.id ?? "");
  const [cutId, setCutId] = useState(cuts[0]?.id ?? "");
  const [caratWeight, setCaratWeight] = useState(1.5);
  const [huePercent, setHuePercent] = useState(50);
  const [darkness, setDarkness] = useState(45);
  const [clarityId, setClarityId] = useState(clarityGrades[1]?.id ?? clarityGrades[0]?.id ?? "");

  const mineral = minerals.find((m) => m.id === mineralId) ?? minerals[0];
  const cut = cuts.find((c) => c.id === cutId) ?? cuts[0];
  const clarity = clarityGrades.find((c) => c.id === clarityId) ?? clarityGrades[0];

  const hue = mineral ? hueAtPercent(mineral.hueMin, mineral.hueMax, huePercent) : 0;
  const dimensions = cut ? estimateDimensionsMm(cut.slug, caratWeight) : null;

  const gradientStops = useMemo(() => {
    if (!mineral) return "";
    const steps = 12;
    const stops = Array.from({ length: steps + 1 }, (_, i) => {
      const p = (i / steps) * 100;
      const h = hueAtPercent(mineral.hueMin, mineral.hueMax, p);
      return resolveGemColor(h, darkness).base;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [mineral, darkness]);

  function handleMineralChange(id: string) {
    const next = minerals.find((m) => m.id === id);
    setMineralId(id);
    if (next) setHuePercent(percentAtHue(next.hueMin, next.hueMax, hue));
  }

  const configuredSpec: ConfiguredSpec | undefined =
    mineral && cut && clarity
      ? {
          mineralId: mineral.id,
          mineralName: mineral.name,
          cutId: cut.id,
          cutName: cut.name,
          caratWeight,
          hue,
          darkness,
          claritySlug: clarity.slug,
          clarityName: clarity.name,
        }
      : undefined;

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-ivory-soft to-ivory p-8">
          {cut && (
            <GemVisualizer
              cutSlug={cut.slug}
              hue={hue}
              darkness={darkness}
              claritySlug={clarity?.slug ?? "eye-clean"}
              caratWeight={caratWeight}
              seedKey="configurator"
              className="aspect-square w-full"
            />
          )}
        </div>
        <p className="mt-2 text-center text-xs text-charcoal/45">
          Illustrative preview — actual dimensions vary by the mineral&apos;s density —{" "}
          {dimensions ? `approximately ${dimensions.lengthMm} x ${dimensions.widthMm} mm at ${caratWeight}ct.` : ""}
        </p>
      </div>

      <div className="space-y-7">
        <div>
          <Label htmlFor="mineral">Mineral / Gem Type</Label>
          <Select id="mineral" value={mineralId} onChange={(e) => handleMineralChange(e.target.value)}>
            {minerals.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="cut">Cut</Label>
          <Select id="cut" value={cutId} onChange={(e) => setCutId(e.target.value)}>
            <optgroup label="Faceted">
              {cuts.filter((c) => c.category === "FACETED").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Cabochon">
              {cuts.filter((c) => c.category === "CABOCHON").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </Select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Carat Weight</Label>
            <span className="text-sm text-charcoal/70">{caratWeight.toFixed(2)} ct</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={20}
            step={0.05}
            value={caratWeight}
            onChange={(e) => setCaratWeight(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Colour ({mineral?.name})</Label>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={huePercent}
            onChange={(e) => setHuePercent(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: resolveGemColor(hue, darkness).base }}
          />
          <div className="mt-1.5 h-2 rounded-full" style={{ background: gradientStops }} />
          <p className="mt-1.5 text-xs text-charcoal/50">
            Constrained to hues realistic for {mineral?.name.toLowerCase()}.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Darkness / Tone</Label>
            <span className="text-sm text-charcoal/70">{darkness < 33 ? "Light" : darkness < 66 ? "Medium" : "Deep"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={darkness}
            onChange={(e) => setDarkness(Number(e.target.value))}
            className="w-full accent-charcoal"
          />
        </div>

        <div>
          <Label htmlFor="clarity">Clarity</Label>
          <Select id="clarity" value={clarityId} onChange={(e) => setClarityId(e.target.value)}>
            {clarityGrades.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {clarity && <p className="mt-1.5 text-xs text-charcoal/55">{clarity.description}</p>}
        </div>

        <div className="pt-2">
          <QuoteRequestPanel
            isAuthenticated={isAuthenticated}
            configuredSpec={configuredSpec}
            productLabel={`your configured ${mineral?.name ?? "gem"}`}
          />
        </div>
      </div>
    </div>
  );
}
