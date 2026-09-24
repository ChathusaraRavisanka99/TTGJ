// Edge-safe (no Prisma/auth imports) — proxy.ts uses this too.

export const STAFF_AREAS = ["orders", "catalog", "requests", "reviews"] as const;
export type StaffArea = (typeof STAFF_AREAS)[number];

export const STAFF_AREA_LABELS: Record<StaffArea, { label: string; description: string }> = {
  orders: { label: "Orders", description: "Mark bank transfers paid, add tracking, revert a payment, chat on an order." },
  catalog: { label: "Gems & Jewelry", description: "Add and edit listings, photos, stock and visibility. No deleting, featuring, cost price, or price changes on existing items." },
  requests: { label: "Messages, quotes & sourcing", description: "Reply to chats and work quote and sourcing requests. These have no store, so they aren't limited by market." },
  reviews: { label: "Review moderation", description: "Approve or reject customer reviews." },
};

const AREA_PATHS: Record<StaffArea, string[]> = {
  orders: ["/admin/orders"],
  catalog: ["/admin/gems", "/admin/jewelry"],
  requests: ["/admin/messages", "/admin/quotes", "/admin/sourcing", "/admin/support"],
  reviews: ["/admin/reviews"],
};

// Sub-pages of an allowed prefix that stay admin-only regardless.
const ADMIN_ONLY_PATTERNS = [/^\/admin\/orders\/manual(\/|$)/, /^\/admin\/sourcing\/[^/]+\/build-order(\/|$)/];

export function parseStaffPermissions(value: unknown): StaffArea[] {
  if (!Array.isArray(value)) return [];
  return STAFF_AREAS.filter((area) => value.includes(area));
}

export function staffAreaForPath(pathname: string): StaffArea | null {
  if (ADMIN_ONLY_PATTERNS.some((re) => re.test(pathname))) return null;
  for (const area of STAFF_AREAS) {
    if (AREA_PATHS[area].some((p) => pathname === p || pathname.startsWith(p + "/"))) return area;
  }
  return null;
}

export function staffCanAccessPath(permissions: readonly string[], pathname: string): boolean {
  const area = staffAreaForPath(pathname);
  return area !== null && permissions.includes(area);
}

export function firstStaffPath(permissions: readonly string[]): string | null {
  for (const area of STAFF_AREAS) {
    if (permissions.includes(area)) return AREA_PATHS[area][0];
  }
  return null;
}

export function staffNavLinks(permissions: readonly string[]): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  if (permissions.includes("orders")) links.push({ href: "/admin/orders", label: "Orders" });
  if (permissions.includes("catalog")) {
    links.push({ href: "/admin/gems", label: "Gemstones" }, { href: "/admin/jewelry", label: "Jewelry" });
  }
  if (permissions.includes("requests")) {
    links.push({ href: "/admin/messages", label: "Messages" }, { href: "/admin/quotes", label: "Quote Requests" }, { href: "/admin/sourcing", label: "Sourcing Requests" });
  }
  if (permissions.includes("reviews")) links.push({ href: "/admin/reviews", label: "Reviews" });
  return links;
}
