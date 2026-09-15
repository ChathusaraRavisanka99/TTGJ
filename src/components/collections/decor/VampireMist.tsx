/** Two blurred crimson/black mist bands drifting past each other — the
 * Vampire page's signature atmosphere, standing in for literal fog/bats. */
export function VampireMist() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="animate-mist-drift-a absolute inset-x-[-20%] top-1/4 h-56 rounded-[100%] bg-[#a3283f]/[0.10] blur-3xl" />
      <div className="animate-mist-drift-b absolute inset-x-[-20%] bottom-0 h-72 rounded-[100%] bg-black/40 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0507] via-transparent to-[#0b0507]" />
    </div>
  );
}
