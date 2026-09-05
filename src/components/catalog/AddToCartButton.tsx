"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import { addToRetailCart } from "@/actions/retail-cart";
import { Button } from "@/components/ui/Button";

// Adding an item stays on the product page (so a customer can add
// several items before checking out) rather than redirecting to the
// cart.
export function AddToCartButton({ gemstoneId, jewelryId }: { gemstoneId?: string; jewelryId?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToRetailCart({ gemstoneId, jewelryId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAdded(true);
    });
  }

  return (
    <div>
      <Button type="button" variant="primary" size="lg" disabled={pending} onClick={handleClick} className="flex items-center gap-2">
        {added ? <Check size={18} /> : <ShoppingBag size={18} />}
        {pending ? "Adding..." : added ? "Added to Cart" : "Add to Cart"}
      </Button>
      {added && (
        <p className="mt-2 text-sm text-charcoal/70">
          <Link href="/account/retail-cart" className="text-gold underline hover:text-charcoal">View Cart</Link> to check out, or keep browsing.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
