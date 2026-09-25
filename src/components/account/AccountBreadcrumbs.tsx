"use client";

import { useAppPathname } from "@/components/providers/MarketProvider";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";

const LABELS: Record<string, string> = {
  orders: "My Orders",
  messages: "Messages",
  support: "Support",
  "retail-cart": "Shopping Cart",
  cart: "Quote Payments",
  sourcing: "Sourcing Requests",
  "custom-designs": "Custom Designs",
  quotes: "Quote Requests",
  rewards: "Points & Referrals",
  business: "Business",
  wishlist: "Wishlist",
  "change-password": "Change Password",
  dig: "Gem Dig",
};

// One trail for every signed-in account page, derived from the URL, so a new
// account page gets one for free (an unknown id-like segment reads "Details").
export function AccountBreadcrumbs() {
  const pathname = useAppPathname();
  const segments = pathname.split("/").filter(Boolean).slice(1); // drop "account"

  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  if (segments.length === 0) {
    items.push({ label: "My Account" });
  } else {
    items.push({ label: "My Account", href: "/account" });
    segments.forEach((seg, i) => {
      const isLast = i === segments.length - 1;
      const label = LABELS[seg] ?? "Details";
      items.push(isLast ? { label } : { label, href: "/account/" + segments.slice(0, i + 1).join("/") });
    });
  }

  return <Breadcrumbs items={items} />;
}
