import { ThemeFlyby } from "./ThemeFlyby";
import { LightningBolt } from "./FlybySilhouettes";

/** Diagonal stage-light beams sweeping across the hero, staggered, plus a
 * single lightning-bolt streak on a fast loop — the Metal/Rock page's
 * signature atmosphere, standing in for a concert stage rather than any
 * literal instrument illustration. */
export function MetalStageLights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <ThemeFlyby top="10%" duration="12s" delay="-4s" rotate={20}>
        <LightningBolt className="h-10 w-5 text-[#c94b2f]/70" />
      </ThemeFlyby>
      <div className="animate-stage-sweep absolute -inset-y-1/4 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#9aa0a8]/20 to-transparent" />
      <div className="animate-stage-sweep absolute -inset-y-1/4 left-0 w-1/4 bg-gradient-to-r from-transparent via-[#8a1f1f]/25 to-transparent [animation-delay:-3.5s]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_14px)]" />
    </div>
  );
}
