import { cn } from "@/lib/utils";

/** Infinite-scrolling text band — pure CSS, no JS needed. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const track = [...items, ...items];
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div className="animate-marquee flex w-max items-center gap-10 group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap opacity-70">
            <span className="font-serif text-lg sm:text-xl">{item}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-gold opacity-100" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
