import Link from "@/components/ui/MarketLink";
import { SUBCULTURE_LIST, type SubcultureKey } from "@/lib/subculture-collections";

/** "Explore Another Side of the Dark" — cards to the other live
 * collections. Only ever rendered inside a hidden collection page itself
 * (never from the main site), and only links to collections that are
 * actually enabled right now, per the brief's cross-discovery rule. */
export function CrossCollectionFooter({
  currentKey,
  blurb,
  liveKeys,
  slugsByKey,
}: {
  currentKey: SubcultureKey;
  blurb: string;
  liveKeys: SubcultureKey[];
  /** Current public slug per collection (admin-editable) — never the
   * fixed code-level `.slug` on SubcultureDef, which won't reflect a
   * rename. */
  slugsByKey: Record<SubcultureKey, string>;
}) {
  const others = SUBCULTURE_LIST.filter((c) => c.key !== currentKey && liveKeys.includes(c.key));
  if (others.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-black/40 py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center font-serif text-2xl text-white/90 sm:text-3xl">{blurb}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((c) => (
            <Link
              key={c.key}
              href={`/collections/${slugsByKey[c.key]}`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <span className="text-2xl">{c.emoji}</span>
              <p className="mt-2 font-serif text-lg text-white/90">{c.shortLabel}</p>
              <p className="mt-2 text-xs text-white/50 transition-colors group-hover:text-white/70">Enter the collection →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
