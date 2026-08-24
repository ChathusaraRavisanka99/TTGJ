"use client";

import { useId, useMemo } from "react";
import { resolveGemColor } from "./color";
import { generateInclusions } from "./inclusions";
import { caratToRenderScale } from "./size";
import { renderCut } from "./render";

export interface GemVisualizerProps {
  cutSlug: string;
  hue: number;
  darkness: number;
  claritySlug: string;
  caratWeight: number;
  saturation?: number;
  seedKey?: string;
  className?: string;
}

/**
 * Isolated, purely props-driven procedural gem renderer. Deliberately has no
 * knowledge of products, quotes, or forms so it can later be swapped for a
 * WebGL/Three.js version without touching surrounding product/quote logic.
 */
export function GemVisualizer({
  cutSlug,
  hue,
  darkness,
  claritySlug,
  caratWeight,
  saturation = 72,
  seedKey,
  className,
}: GemVisualizerProps) {
  const uid = useId();
  const scale = caratToRenderScale(caratWeight);
  const cut = useMemo(() => renderCut(cutSlug, scale), [cutSlug, scale]);
  const colors = useMemo(() => resolveGemColor(hue, darkness, saturation), [hue, darkness, saturation]);
  const inclusions = useMemo(
    () => generateInclusions(seedKey ?? cutSlug, claritySlug, cut.center[0], cut.center[1], cut.boundingRadius),
    [seedKey, cutSlug, claritySlug, cut.center, cut.boundingRadius]
  );

  const gradientId = `gem-grad-${uid}`;
  const domeGradientId = `gem-dome-${uid}`;
  const shadowFilterId = `gem-shadow-${uid}`;

  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      role="img"
      aria-label={`${cutSlug.replace(/-/g, " ")} gem preview`}
    >
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="55%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>
        <radialGradient id={domeGradientId} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="45%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(20,20,20,0.25)" />
        </filter>
      </defs>

      <g filter={`url(#${shadowFilterId})`}>
        {cut.ellipse ? (
          <ellipse cx={cut.center[0]} cy={cut.center[1]} rx={cut.ellipse.rx} ry={cut.ellipse.ry} fill={`url(#${gradientId})`} />
        ) : (
          <path d={cut.outlinePath} fill={`url(#${cut.style.startsWith("dome") ? domeGradientId : gradientId})`} />
        )}
      </g>

      {/* Outline stroke */}
      {cut.ellipse ? (
        <ellipse
          cx={cut.center[0]}
          cy={cut.center[1]}
          rx={cut.ellipse.rx}
          ry={cut.ellipse.ry}
          fill="none"
          stroke={colors.shadow}
          strokeWidth={1.2}
          strokeOpacity={0.5}
        />
      ) : (
        <path d={cut.outlinePath} fill="none" stroke={colors.shadow} strokeWidth={1.2} strokeOpacity={0.5} />
      )}

      {/* Facet lines (faceted / rose styles) */}
      {cut.facetLines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={colors.highlight}
          strokeWidth={0.6}
          strokeOpacity={0.35}
        />
      ))}

      {/* Step-cut rings (emerald / asscher / octagon / baguette) */}
      {cut.stepPaths?.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={colors.highlight} strokeWidth={0.7} strokeOpacity={0.4} />
      ))}

      {/* Table facet (flat top) */}
      {cut.tablePath && (
        <path d={cut.tablePath} fill={colors.table} fillOpacity={0.5} stroke={colors.highlight} strokeWidth={0.5} strokeOpacity={0.5} />
      )}

      {/* Sugarloaf ridge highlight */}
      {cut.style === "dome-ridge" &&
        cut.facetLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={colors.highlight}
            strokeWidth={1}
            strokeOpacity={0.3}
          />
        ))}

      {/* Subtle inclusion overlay */}
      {inclusions.map((speck, i) => (
        <circle key={i} cx={speck.cx} cy={speck.cy} r={speck.r} fill="#2a2a2a" opacity={speck.opacity} />
      ))}

      {/* Soft top highlight to sell "gem" over "flat shape" */}
      <ellipse
        cx={cut.center[0] - cut.boundingRadius * 0.32}
        cy={cut.center[1] - cut.boundingRadius * 0.42}
        rx={cut.boundingRadius * 0.28}
        ry={cut.boundingRadius * 0.16}
        fill="white"
        opacity={0.35}
      />
    </svg>
  );
}
