import Link from "next/link";
import Image from "next/image";
import { Gem } from "lucide-react";
import { StockBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface JewelryCardProps {
  slug: string;
  name: string;
  pieceType: string;
  metalType: string;
  stockStatus: string;
  primaryImageUrl?: string;
  /** Only rendered when the admin has opted this item into public pricing. */
  price?: number | null;
  showPrice?: boolean;
}

const METAL_LABELS: Record<string, string> = {
  GOLD: "Gold",
  WHITE_GOLD: "White Gold",
  ROSE_GOLD: "Rose Gold",
  PLATINUM: "Platinum",
  SILVER: "Silver",
};

export function JewelryCard(props: JewelryCardProps) {
  return (
    <Link
      href={`/jewelry/${props.slug}`}
      className="group block overflow-hidden rounded-xl border border-border-subtle bg-surface transition-shadow hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="relative aspect-square bg-ivory-soft">
        {props.primaryImageUrl ? (
          <Image
            src={props.primaryImageUrl}
            alt={props.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-charcoal/25">
            <Gem size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StockBadge status={props.stockStatus} />
        </div>
      </div>
      <div className="p-4">
        <p className="font-serif text-lg leading-snug text-charcoal">{props.name}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/50">
          {props.pieceType.charAt(0) + props.pieceType.slice(1).toLowerCase()} · {METAL_LABELS[props.metalType]}
        </p>
        {props.showPrice && props.price != null && (
          <p className="mt-2 font-serif text-base text-charcoal">{formatPrice(props.price)}</p>
        )}
      </div>
    </Link>
  );
}
