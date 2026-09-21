"use client";

import { useTranslations } from "next-intl";
import { Badge, STOCK_STYLES } from "@/components/ui/Badge";

/** StockBadge for the storefront — the label is translated. The admin lists
 * keep the plain English StockBadge. */
export function StorefrontStockBadge({ status }: { status: string }) {
  const t = useTranslations("catalog.stock");
  const known = status === "AVAILABLE" || status === "RESERVED" || status === "SOLD";
  return <Badge className={STOCK_STYLES[status] ?? ""}>{known ? t(status) : status}</Badge>;
}
