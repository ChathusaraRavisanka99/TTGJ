import { ThemeFlyby } from "./ThemeFlyby";
import { WingedSilhouette } from "./FlybySilhouettes";

/** Victorian-ironwork corner brackets + a soft moonlight glow — the Goth
 * page's one signature motif, deliberately restrained (no skulls/bats):
 * elegance read through ornament, not horror iconography. A single raven
 * crossing high overhead on a long loop is the one exception — distant
 * and silhouetted, closer to a rare wildlife glimpse than horror
 * iconography. */
export function GothOrnamentalFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <ThemeFlyby top="14%" duration="19s" delay="-6s">
        <WingedSilhouette className="h-4 w-10 text-[#f2ece4]/60" />
      </ThemeFlyby>
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f2ece4]/[0.06] blur-3xl" />
      {[
        "left-4 top-4 sm:left-8 sm:top-8",
        "right-4 top-4 rotate-90 sm:right-8 sm:top-8",
        "left-4 bottom-4 -rotate-90 sm:left-8 sm:bottom-8",
        "right-4 bottom-4 rotate-180 sm:right-8 sm:bottom-8",
      ].map((position, i) => (
        <svg key={i} viewBox="0 0 64 64" className={`absolute h-12 w-12 text-[#8a5a6b]/45 sm:h-16 sm:w-16 ${position}`} fill="none">
          <path d="M2 2 L2 22 M2 2 L22 2" stroke="currentColor" strokeWidth="1" />
          <path d="M2 30 Q2 2 30 2" stroke="currentColor" strokeWidth="1" />
          <circle cx="2" cy="2" r="2.5" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
