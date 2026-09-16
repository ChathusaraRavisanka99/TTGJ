import type { CSSProperties, ReactNode } from "react";

/** One subculture theme's "signature flyby" — a small silhouette crossing
 * the hero on a long, infrequent loop (see the theme-flyby/flyby-bob
 * keyframes in globals.css). Two nested animated elements: this outer
 * span handles the long horizontal crossing + fade in/out, the inner one
 * (rendered by the caller wrapping its own icon) gets `animate-flyby-bob`
 * for a quick wing-flap/twinkle layered on top — see globals.css's
 * comment on why that's two keyframes on two elements rather than one. */
export function ThemeFlyby({
  children,
  top,
  duration = "16s",
  delay = "0s",
  rotate = -6,
  reverse = false,
}: {
  children: ReactNode;
  /** Vertical position, e.g. "18%" — the crossing itself is a straight
   * horizontal line at this height. */
  top: string;
  duration?: string;
  delay?: string;
  rotate?: number;
  /** Right-to-left instead of the left-to-right default — varying the
   * direction between a theme's own multiple flybys (if any) keeps them
   * from reading as one flyby looping twice. */
  reverse?: boolean;
}) {
  return (
    <span
      className="animate-theme-flyby absolute left-0"
      style={
        {
          top,
          "--flyby-duration": duration,
          "--flyby-delay": delay,
          "--flyby-rotate": `${reverse ? -rotate : rotate}deg`,
          "--flyby-start-x": reverse ? "115vw" : "-15vw",
          "--flyby-end-x": reverse ? "-15vw" : "115vw",
        } as CSSProperties
      }
    >
      <span className="animate-flyby-bob block">{children}</span>
    </span>
  );
}
