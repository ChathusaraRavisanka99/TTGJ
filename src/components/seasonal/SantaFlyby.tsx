/** Winter promotions page's one signature moment — Santa's sleigh arcs in
 * from one corner, crests near the top of the hero, and exits the other
 * corner, then loops (see the santa-flyby keyframe in globals.css).
 * Plain emoji, not an SVG silhouette: winter's the one seasonal theme
 * that's explicitly festive/commercial rather than editorial (this page
 * already borrows Halloween's jack-o'-lantern-row precedent for the same
 * reason), so a literal sleigh reads as intended rather than as a
 * costume-shop moment the subculture collection pages avoid. */
export function SantaFlyby() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="animate-santa-flyby absolute left-0 top-[20%] text-4xl sm:text-5xl">🎅🛷</div>
    </div>
  );
}
