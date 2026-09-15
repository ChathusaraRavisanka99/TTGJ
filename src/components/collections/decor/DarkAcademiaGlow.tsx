/** A flickering candlelight glow low in the frame plus a soft vignette —
 * the Dark Academia page's one signature motif, standing in for a
 * candlelit study rather than any literal book/quill illustration. */
export function DarkAcademiaGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="animate-candle-flicker absolute bottom-0 left-[15%] h-64 w-64 rounded-full bg-gold/25 blur-3xl" />
      <div className="animate-candle-flicker absolute bottom-0 right-[20%] h-48 w-48 rounded-full bg-gold/15 blur-3xl [animation-delay:-2.5s]" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgba(21,15,10,0.55)_100%)]" />
    </div>
  );
}
