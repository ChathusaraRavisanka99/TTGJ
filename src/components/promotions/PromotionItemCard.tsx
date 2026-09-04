import Link from "next/link";
import Image from "next/image";
import { Gem } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PromotionBadge } from "@/components/catalog/CardPrice";

interface PromotionItemCardProps {
  name: string;
  href: string;
  imageUrl?: string;
  promoPrice: number;
  // Only shown struck through when the underlying item has opted into
  // public pricing (showPrice) and its regular price is actually higher
  // than the promo one — otherwise there's nothing honest to compare
  // against, same "price display is opt-in per item" rule the rest of
  // the catalog follows.
  regularPrice: number | null;
}

export function PromotionItemCard({ name, href, imageUrl, promoPrice, regularPrice }: PromotionItemCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-border-subtle bg-surface transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-ivory-soft">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-charcoal/25">
            <Gem size={48} strokeWidth={1} />
          </div>
        )}
        <PromotionBadge className="absolute left-3 top-3" />
      </div>
      <div className="p-4">
        <p className="truncate font-serif text-lg text-charcoal">{name}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="font-serif text-lg text-gold">{formatPrice(promoPrice)}</p>
          {regularPrice != null && regularPrice > promoPrice && (
            <p className="text-sm text-charcoal/40 line-through">{formatPrice(regularPrice)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
