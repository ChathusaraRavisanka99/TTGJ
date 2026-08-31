import { cn } from "@/lib/utils";

export interface MarqueeItem {
  label: string;
  /** Dot colour — defaults to gold when omitted. */
  color?: string;
}

/** Infinite-scrolling text band — pure CSS, no JS needed. */
export function Marquee({ items, className }: { items: (string | MarqueeItem)[]; className?: string }) {
  const normalized = items.map((item) => (typeof item === "string" ? { label: item } : item));
  const track = [...normalized, ...normalized];
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div className="animate-marquee flex w-max items-center gap-10 group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap opacity-70">
            <span className="font-serif text-lg sm:text-xl">{item.label}</span>
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full opacity-100"
              style={{ backgroundColor: item.color ?? "var(--color-gold)" }}
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}
