"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { updateRetailCartItemQuantity, removeRetailCartItem } from "@/actions/retail-cart";
import { formatPrice } from "@/lib/utils";

interface Item {
  id: string;
  quantity: number;
  unitPrice: number;
  label: string;
  href: string;
  imageUrl?: string;
}

export function RetailCartItemRow({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setQuantity(quantity: number) {
    startTransition(async () => {
      await updateRetailCartItemQuantity(item.id, quantity);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeRetailCartItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border-subtle py-4 last:border-0">
      <Link href={item.href} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ivory-soft">
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={item.href} className="truncate text-sm font-medium text-charcoal hover:text-gold">
          {item.label}
        </Link>
        <p className="mt-0.5 text-sm text-charcoal/60">{formatPrice(item.unitPrice)} each</p>
      </div>
      {/* Wraps to its own full-width row on narrow screens (basis-full),
          instead of sharing the item-name row's already-tight space —
          that's what was causing the price/quantity controls to overlap
          on a phone-width viewport. Stays inline, pushed to the right
          edge, from sm: up. */}
      <div className="flex w-full basis-full items-center justify-end gap-4 sm:w-auto sm:basis-auto">
        <div className="flex items-center gap-2">
          <select
            value={item.quantity}
            disabled={pending}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-sm"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button type="button" title="Remove" disabled={pending} onClick={remove} className="text-charcoal/40 hover:text-red-700">
            <Trash2 size={16} />
          </button>
        </div>
        <p className="w-20 shrink-0 text-right font-serif text-charcoal sm:w-24">{formatPrice(item.unitPrice * item.quantity)}</p>
      </div>
    </div>
  );
}
