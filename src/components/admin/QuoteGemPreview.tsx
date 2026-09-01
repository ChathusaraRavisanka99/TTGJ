import { GemVisualizer } from "@/components/gem-visualizer/GemVisualizer";
import { resolveGemColor, hslStringToHex } from "@/components/gem-visualizer/color";
import type { QuoteGemVisual } from "@/lib/quote-visual";

/** Renders a quote's gem — cut, colour swatch, and colour code — whether it
 * came from an existing catalog item or a standalone configurator spec. */
export function QuoteGemPreview({ visual, seedKey }: { visual: QuoteGemVisual; seedKey: string }) {
  const colors = resolveGemColor(visual.hue, visual.darkness, visual.saturation ?? 72);
  const hex = hslStringToHex(colors.base);

  return (
    <div className="flex gap-4">
      <div className="w-28 shrink-0 self-start rounded-lg bg-gradient-to-b from-ivory-soft to-ivory p-3">
        <GemVisualizer
          cutSlug={visual.cutSlug}
          hue={visual.hue}
          darkness={visual.darkness}
          saturation={visual.saturation}
          claritySlug={visual.claritySlug}
          caratWeight={visual.caratWeight}
          seedKey={seedKey}
          className="w-full"
        />
      </div>
      <div className="text-sm">
        <p className="text-charcoal">{visual.mineralName} · {visual.cutName}</p>
        <p className="mt-0.5 text-charcoal/60">{visual.caratWeight} ct · {visual.clarityName}</p>
        {visual.colorLabel && <p className="mt-0.5 text-charcoal/60">&ldquo;{visual.colorLabel}&rdquo;</p>}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-5 w-5 shrink-0 rounded-full border border-border-subtle"
            style={{ backgroundColor: colors.base }}
            aria-hidden
          />
          <span className="font-mono text-xs text-charcoal/70">{hex}</span>
          <span className="font-mono text-xs text-charcoal/45">{colors.base}</span>
        </div>
      </div>
    </div>
  );
}
