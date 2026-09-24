"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "@/components/ui/MarketLink";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { addBundleToCart } from "@/actions/retail-cart";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { BundleDisplay } from "@/lib/bundles";

export function CompleteTheLookPanel({ bundle, currency, isAuthenticated }: { bundle: BundleDisplay; currency: "USD" | "LKR"; isAuthenticated: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const individualTotal = bundle.items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const savings = Math.max(0, individualTotal - bundle.price);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addBundleToCart(bundle.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAdded(true);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-gold/40 bg-gold/5 p-5">
      <p className="text-xs uppercase tracking-wide text-gold-deep">Complete the Look</p>
      <p className="mt-1 font-serif text-lg text-charcoal">{bundle.name}</p>

      <div className="mt-3 flex flex-wrap gap-3">
        {bundle.items.map((item) => (
          <Link key={`${item.kind}-${item.id}`} href={`/${item.kind === "gemstone" ? "gems" : "jewelry"}/${item.slug}`} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-2 text-sm hover:border-gold/50">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-ivory-soft">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                <Gem size={16} strokeWidth={1} className="absolute inset-0 m-auto text-charcoal/25" />
              )}
            </span>
            <span className="text-charcoal">{item.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2 text-sm">
        <span className="text-charcoal/50 line-through">{formatPrice(individualTotal, currency)}</span>
        <span className="font-serif text-lg text-gold-deep">{formatPrice(bundle.price, currency)}</span>
        {savings > 0 && <span className="text-xs text-charcoal/60">Save {formatPrice(savings, currency)}</span>}
      </div>

      {isAuthenticated ? (
        added ? (
          <p className="mt-3 text-sm text-green-700">Added to your cart.</p>
        ) : (
          <Button type="button" variant="gold" className="mt-3" onClick={handleAdd} disabled={pending}>
            {pending ? "Adding..." : "Add All to Cart"}
          </Button>
        )
      ) : (
        <p className="mt-3 text-sm text-charcoal/65">Sign in to add this set to your cart.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
