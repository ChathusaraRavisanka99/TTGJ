import type { SubcultureDef } from "@/lib/subculture-collections";
import { DriftParticles } from "./DriftParticles";
import { GothOrnamentalFrame } from "./GothOrnamentalFrame";
import { VampireMist } from "./VampireMist";
import { DarkAcademiaGlow } from "./DarkAcademiaGlow";
import { MetalStageLights } from "./MetalStageLights";
import { WitchyCelestialRing } from "./WitchyCelestialRing";

const MOTIFS: Record<SubcultureDef["decor"], React.ComponentType> = {
  goth: GothOrnamentalFrame,
  vampire: VampireMist,
  "dark-academia": DarkAcademiaGlow,
  metal: MetalStageLights,
  witchy: WitchyCelestialRing,
};

/** One collection's full atmosphere layer — its bespoke motif plus the
 * shared glyph drift, seeded off its own key so the scattered layout is
 * deterministic (server-rendered, no hydration mismatch — see
 * DriftParticles' own comment). */
export function CollectionDecor({ theme }: { theme: SubcultureDef }) {
  const Motif = MOTIFS[theme.decor];
  return (
    <>
      <Motif />
      <DriftParticles config={theme.particles} seed={theme.key.length * 7} />
    </>
  );
}
