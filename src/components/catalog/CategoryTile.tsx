import Image from "next/image";
import { ArrowUpRight, Gem } from "lucide-react";
import Link from "@/components/ui/MarketLink";
import { cn } from "@/lib/utils";

/** One card in a "browse by category" grid: a cover photo, the category name
 * and how many pieces are in it. Server-rendered, plain link. */
export function CategoryTile({
  href,
  label,
  countLabel,
  description,
  image,
  emphasis = false,
}: {
  href: string;
  label: string;
  countLabel?: string;
  description?: string;
  image: string | null;
  /** The "view everything" tile — set apart with a gold frame. */
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-midnight ring-1 transition-shadow duration-500 hover:shadow-xl",
        emphasis ? "ring-gold/60" : "ring-charcoal/5",
      )}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-charcoal-soft to-midnight text-gold/40">
          <Gem size={56} strokeWidth={1} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 via-40% to-transparent" />
      <div className="relative p-4 sm:p-5">
        {countLabel && <p className="text-[11px] uppercase tracking-[0.2em] text-gold-soft">{countLabel}</p>}
        <p className="mt-1 flex items-center justify-between gap-2 font-serif text-xl text-ivory sm:text-2xl">
          {label}
          <ArrowUpRight size={18} className="shrink-0 text-gold-soft transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </p>
        {description && <p className="mt-1 line-clamp-2 text-xs text-ivory/75">{description}</p>}
      </div>
    </Link>
  );
}

export function CategoryGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">{children}</div>;
}
