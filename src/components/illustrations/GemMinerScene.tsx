// A small hand-drawn scene for the site's error pages (not-found,
// unauthorized): a miner mid-swing at a gem cluster set in the rock face.
// Plain SVG + CSS animation (see globals.css's animate-miner-swing /
// animate-gem-sparkle) — no JS needed, so this renders identically whether
// the page it's on is a Server Component or not, and costs nothing before
// hydration. Kept in the site's own palette (charcoal figure/rock, gold
// gem) rather than a stock illustration style, to sit naturally next to
// the rest of the brand rather than reading as a generic 404 clip-art.
export function GemMinerScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 320" className={className} role="img" aria-label="An illustration of a gem miner swinging a pickaxe at a cluster of gems embedded in a rock face">
      {/* Ground */}
      <line x1="16" y1="286" x2="464" y2="286" className="stroke-charcoal/15" strokeWidth="1.5" />

      {/* Rock wall, with a few facet lines for texture */}
      <path
        d="M292,286 L292,196 L316,164 L304,128 L338,100 L366,112 L388,86 L422,104 L440,146 L464,286 Z"
        className="fill-charcoal-soft/90"
      />
      <path
        d="M316,164 L346,182 M338,100 L352,150 M388,86 L398,166 M366,112 L380,190"
        className="stroke-charcoal/20"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Gem cluster embedded in the rock, each sparkle twinkling on its
          own offset so they read as a scatter rather than one flash. */}
      <g>
        <polygon points="362,168 378,152 396,168 378,202" className="fill-gold stroke-gold-soft" strokeWidth="1.5" />
        <polygon points="404,140 416,128 428,140 416,164" className="fill-gold-soft stroke-gold" strokeWidth="1.5" />
        <polygon points="336,142 346,132 356,142 346,162" className="fill-gold/80 stroke-gold-soft" strokeWidth="1" />

        {[
          { x: 350, y: 130, delay: "0s" },
          { x: 400, y: 176, delay: "0.6s" },
          { x: 420, y: 118, delay: "1.2s" },
          { x: 330, y: 158, delay: "1.8s" },
        ].map((s, i) => (
          <path
            key={i}
            d={`M${s.x},${s.y - 6} L${s.x + 1.5},${s.y - 1.5} L${s.x + 6},${s.y} L${s.x + 1.5},${s.y + 1.5} L${s.x},${s.y + 6} L${s.x - 1.5},${s.y + 1.5} L${s.x - 6},${s.y} L${s.x - 1.5},${s.y - 1.5} Z`}
            className="animate-gem-sparkle fill-gold-soft"
            style={{ animationDelay: s.delay }}
          />
        ))}
      </g>

      {/* Miner: legs, body, head, cap */}
      <g className="stroke-charcoal" strokeWidth="7" strokeLinecap="round">
        <line x1="168" y1="232" x2="156" y2="284" />
        <line x1="172" y1="232" x2="194" y2="284" />
      </g>
      <path d="M170,168 Q152,196 158,232 L182,232 Q188,196 170,168 Z" className="fill-charcoal" />
      <circle cx="170" cy="148" r="17" className="fill-charcoal" />
      <path d="M151,144 Q170,126 189,144 L189,150 L151,150 Z" className="fill-charcoal-soft" />

      {/* Swinging arm + pickaxe, pivoting at the shoulder */}
      <g className="animate-miner-swing" style={{ transformOrigin: "184px 172px" }}>
        <line x1="184" y1="172" x2="222" y2="128" className="stroke-charcoal" strokeWidth="7" strokeLinecap="round" />
        <line x1="222" y1="128" x2="256" y2="90" className="stroke-gold-soft" strokeWidth="4.5" strokeLinecap="round" />
        <polygon points="240,78 268,66 280,88 254,104" className="fill-gold stroke-charcoal-soft" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
