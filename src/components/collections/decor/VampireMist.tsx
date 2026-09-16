import { ThemeFlyby } from "./ThemeFlyby";
import { WingedSilhouette } from "./FlybySilhouettes";

/** Two blurred crimson/black mist bands drifting past each other, plus a
 * single bat crossing on a long loop — the Vampire page's signature
 * atmosphere. The brief for this theme explicitly allows bats "as the
 * rarest accent," unlike Goth's more restrained raven — so this one gets
 * a shorter loop and a second, reversed pass for a touch more presence. */
export function VampireMist() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <ThemeFlyby top="20%" duration="15s" delay="-3s">
        <WingedSilhouette className="h-4 w-9 text-[#a3283f]/70" />
      </ThemeFlyby>
      <ThemeFlyby top="42%" duration="17s" delay="-11s" reverse>
        <WingedSilhouette className="h-3 w-7 text-[#a3283f]/50" />
      </ThemeFlyby>
      <div className="animate-mist-drift-a absolute inset-x-[-20%] top-1/4 h-56 rounded-[100%] bg-[#a3283f]/[0.10] blur-3xl" />
      <div className="animate-mist-drift-b absolute inset-x-[-20%] bottom-0 h-72 rounded-[100%] bg-black/40 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0507] via-transparent to-[#0b0507]" />
    </div>
  );
}
