import type { ConfiguredSpec } from "@/lib/validation/quote";

export interface QuoteGemVisual {
  cutSlug: string;
  cutName: string;
  mineralName: string;
  hue: number;
  darkness: number;
  saturation?: number;
  claritySlug: string;
  clarityName: string;
  caratWeight: number;
  colorLabel?: string | null;
}

interface QuoteGemstoneRelation {
  cut: { slug: string; name: string };
  mineral: { name: string };
  clarityGrade: { slug: string; name: string };
  colorHue: number;
  colorLightness: number;
  colorSaturation: number;
  colorLabel: string | null;
  caratWeight: number;
}

/**
 * A quote's gem can come from either an existing catalog Gemstone or a
 * standalone configurator spec (QuoteRequest.configuredSpec) — this
 * normalizes either into one shape so the visual/colour-code display
 * doesn't need to branch. Returns null when there's nothing to render
 * (jewelry-only quotes, or a pre-cutSlug configuredSpec row saved before
 * that field existed).
 */
export function getQuoteGemVisual(quote: {
  gemstone: QuoteGemstoneRelation | null;
  configuredSpec: unknown;
}): QuoteGemVisual | null {
  if (quote.gemstone) {
    const g = quote.gemstone;
    return {
      cutSlug: g.cut.slug,
      cutName: g.cut.name,
      mineralName: g.mineral.name,
      hue: g.colorHue,
      darkness: g.colorLightness,
      saturation: g.colorSaturation,
      claritySlug: g.clarityGrade.slug,
      clarityName: g.clarityGrade.name,
      caratWeight: g.caratWeight,
      colorLabel: g.colorLabel,
    };
  }

  const spec = quote.configuredSpec as ConfiguredSpec | null;
  if (spec && spec.cutSlug && spec.mineralName && spec.clarityName) {
    return {
      cutSlug: spec.cutSlug,
      cutName: spec.cutName,
      mineralName: spec.mineralName,
      hue: spec.hue,
      darkness: spec.darkness,
      claritySlug: spec.claritySlug,
      clarityName: spec.clarityName,
      caratWeight: spec.caratWeight,
      colorLabel: null,
    };
  }

  return null;
}
