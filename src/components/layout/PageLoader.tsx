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
 */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-charcoal py-24">
      <div className="animate-loader-in flex flex-col items-center">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold-soft">Ceylon Gemstones</p>
        <h1 className="font-serif text-3xl tracking-[0.12em] text-ivory sm:text-4xl">RATNAVUE</h1>
        <div className="mt-6 h-px w-32 animate-pulse bg-gold sm:w-40" />
      </div>
    </div>
  );
}
