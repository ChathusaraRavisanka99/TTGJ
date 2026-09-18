import { cn } from "@/lib/utils";

/**
 * Decorative side panels for product detail pages on wide viewports — fills
 * the bare ivory gutters beside the max-w-6xl content column with
 * single-line "tattoo linework" art drawn from Sri Lankan heritage rather
 * than an abstract pattern, so the empty margin reads as belonging to the
 * brand rather than as filler. Reads top to bottom as one continuous vine
 * (the Kandyan-art "liya vela" scrolling-vine border motif) rooted in a
 * Sandakada Pahana — the carved semi-circular "moonstone" threshold stone
 * found at ancient temple and palace entrances — and blooming up through a
 * stylised Sigiriya rock (one of the island's ancient wonders), an
 * elephant, and a lotus (Sri Lanka's national flower). The moonstone base
 * is a deliberate echo: a stone literally called a "moonstone" anchoring a
 * gemstone brand's own decoration.
 *
 * Pure stroke, no fill — single-colour linework is what actually reads as
 * "tattoo art" rather than illustration, and it keeps this legible as a
 * quiet background element instead of competing with the product photo.
 * Hidden below xl: there's no spare gutter to fill on any narrower
 * viewport, and hidden from screen readers as pure decoration.
 */
export function HeritageSideArt({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 800"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={cn(
        "pointer-events-none hidden text-gold/30 xl:block",
        side === "right" && "-scale-x-100",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The vine — one continuous line from the moonstone base up to the
          lotus, with the other motifs threaded along its length. */}
      <path d="M60,112 C92,150 28,190 60,235 C90,275 30,300 46,335 C36,360 40,400 60,420 C90,445 30,480 45,510 C34,530 40,560 60,585 C88,610 32,635 60,660" />
      {/* Small leaf sprigs off the vine */}
      <path d="M60,150 Q78,146 82,132 M60,270 Q42,266 37,252 M60,400 Q80,398 86,384 M60,540 Q40,538 33,524" />

      {/* Lotus bloom, top — 8 petals fanned from a shared centre. */}
      <g transform="translate(60,78)">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M0,0 C-13,-8 -13,-30 0,-40 C13,-30 13,-8 0,0 Z" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="7" />
      </g>

      {/* Sigiriya rock — a monolithic table-rock rising from a talus slope,
          two carved terrace lines, the summit structure's remnant, and a
          pair of birds passing on either side. */}
      <g transform="translate(13,250) scale(0.95)">
        <path d="M12,96 Q18,72 26,62 L27,34 Q28,18 40,10 Q50,4 60,7 Q71,10 75,22 Q78,30 75,36 L74,62 Q84,72 90,96 Z" />
        <path d="M27,50 L74,50 M30,66 L72,66" />
        <path d="M42,10 Q44,4 48,3" />
        <path d="M18,30 Q10,26 8,32 M84,26 Q92,22 94,28" />
      </g>

      {/* Elephant, built from simple shapes rather than one intricate path. */}
      <g transform="translate(18,405) scale(0.9)">
        <path d="M20,45 Q14,30 30,22 Q45,14 62,20 Q76,25 78,38 Q80,48 72,50 L26,50 Q18,50 20,45 Z" />
        <path d="M20,45 Q8,44 6,32 Q5,22 15,18 Q24,15 28,24 Q30,32 24,40 Q22,44 20,45 Z" />
        <path d="M13,20 Q0,18 -1,32 Q0,42 12,38 Q16,36 15,28 Q14,22 13,20 Z" />
        <path d="M8,32 Q2,40 6,50 Q8,56 14,54" />
        <path d="M28,50 L27,62 M40,50 L39,62 M58,50 L59,62 M70,50 L71,62" strokeWidth="3" />
        <path d="M78,38 Q86,42 84,50 Q83,53 86,54" />
        <circle cx="19" cy="28" r="0.9" fill="currentColor" />
      </g>

      {/* Sandakada Pahana — the moonstone threshold stone the whole vine
          grows from: concentric bands and a small bud at its centre. */}
      <g transform="translate(60,700)">
        <path d="M-50,0 A50,50 0 0 0 50,0" />
        <path d="M-38,0 A38,38 0 0 0 38,0" />
        <path d="M-26,0 A26,26 0 0 0 26,0" />
        <path d="M-14,0 A14,14 0 0 0 14,0" />
        {Array.from({ length: 13 }, (_, i) => {
          const angle = (Math.PI * (i + 1)) / 14;
          const x1 = -50 * Math.cos(angle);
          const y1 = -50 * Math.sin(angle);
          const x2 = -58 * Math.cos(angle);
          const y2 = -58 * Math.sin(angle);
          return <path key={i} d={`M${x1},${y1} L${x2},${y2}`} />;
        })}
      </g>
    </svg>
  );
}
