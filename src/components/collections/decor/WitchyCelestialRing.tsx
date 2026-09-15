/** A faint, slowly-rotating celestial diagram — a dashed orbit ring with
 * scattered star points and a crescent-moon mark — the Witchy/Occult
 * page's signature motif, tarot/astronomy-diagram in spirit rather than
 * any literal pentagram or costume-shop occult symbol. */
export function WitchyCelestialRing() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
      <svg viewBox="0 0 400 400" className="animate-celestial-rotate h-[130%] w-[130%] max-w-none text-[#7a6fb0]/25 sm:h-[90%] sm:w-[90%]">
        <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1 10" />
        <circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="0.5 14" />
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 180;
          const cx = 200 + Math.cos(angle) * r;
          const cy = 200 + Math.sin(angle) * r;
          return <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.5 : 1.3} fill="currentColor" />;
        })}
        <path d="M330 90 A20 20 0 1 0 330 130 A16 16 0 1 1 330 90 Z" fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}
