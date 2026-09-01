/**
 * Next.js mounts this automatically (as a Suspense fallback) any time a
 * route segment's data fetch takes long enough to be perceptible — no
 * manual wiring needed beyond the sibling loading.tsx files that render it.
 * Shares IntroLoader's visual language (serif wordmark, gold kicker, a thin
 * gold rule) since that's the animation moment already established as the
 * site's signature, but calibrated differently: IntroLoader is a one-shot,
 * multi-second reveal gated to play once per session; this can mount and
 * unmount at any moment depending on how long the real fetch takes.
 *
 * Deliberately a plain Server Component with a CSS keyframe animation, not
 * a motion/react client component: a loading indicator needs to paint the
 * instant it mounts, including in the exact "JS is still loading" moments
 * it exists to cover for — a JS-library-driven animation can itself be
 * delayed by that same slow load, which showed up as a real, confirmed
 * blank-charcoal flash under a throttled-network test.
 *
 * The wordmark/kicker/rule glow-and-dim on an unending loop (rather than
 * just sitting there once loader-in's one-shot entrance finishes) so a
 * navigation that takes a couple of seconds still visibly reads as "still
 * working," not "stuck." Page content picks up the baton on the other end
 * — see .animate-page-in in MainWrapper — so the loader's exit and the new
 * page's arrival read as one continuous motion.
 */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-charcoal py-24">
      <div className="animate-loader-in flex flex-col items-center">
        <p className="animate-loader-text-glow mb-4 text-[10px] uppercase tracking-[0.35em] text-gold-soft">
          Ceylon Gemstones
        </p>
        <h1 className="animate-loader-text-glow font-serif text-3xl tracking-[0.12em] text-ivory sm:text-4xl">
          RATNAVUE
        </h1>
        <div className="animate-loader-line-glow mt-6 h-px w-32 bg-gold sm:w-40" />
      </div>
    </div>
  );
}
