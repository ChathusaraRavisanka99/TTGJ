import type { Metadata } from "next";
import Link from "@/components/ui/MarketLink";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderCard, orderCardInclude } from "@/components/account/OrderCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders" };

type Tab = "all" | "pending" | "paid" | "closed";

const TAB_STATUSES: Record<Tab, string[] | null> = {
  all: null,
  pending: ["PENDING_PAYMENT"],
  paid: ["PAID"],
  // Cancelled orders and failed payments are "closed" — nothing left to do on them.
  closed: ["CANCELLED", "PAYMENT_FAILED"],
};

export default async function AccountOrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const session = await auth();
  if (!session?.user) return null;

  const [sp, t] = await Promise.all([searchParams, getTranslations("orders")]);
  const tab: Tab = sp.status === "pending" || sp.status === "paid" || sp.status === "closed" ? sp.status : "all";
  // Set by ReturnStatus's post-payment redirect (?highlight=ORD-...#ORD-...)
  // so a customer coming straight from PayHere lands on the right order
  // without having to scan the whole list — see components/checkout/ReturnStatus.tsx.
  const highlight = typeof sp.highlight === "string" ? sp.highlight : null;

  const statuses = TAB_STATUSES[tab];
  const [orders, groups] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id, ...(statuses ? { status: { in: statuses as never[] } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: orderCardInclude,
    }),
    prisma.order.groupBy({ by: ["status"], where: { userId: session.user.id }, _count: { _all: true } }),
  ]);

  const countFor = (names: string[] | null) => groups.filter((g) => !names || names.includes(g.status)).reduce((sum, g) => sum + g._count._all, 0);
  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: t("tabs.all") },
    { key: "pending", label: t("tabs.pending") },
    { key: "paid", label: t("tabs.paid") },
    { key: "closed", label: t("tabs.closed") },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold-deep">{t("kicker")}</p>
      <h1 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">{t("title")}</h1>

      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1 border-b border-border-subtle">
          {tabs.map(({ key, label }) => {
            const active = tab === key;
            const count = countFor(TAB_STATUSES[key]);
            return (
              <Link
                key={key}
                href={key === "all" ? "/account/orders" : `/account/orders?status=${key}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors",
                  active ? "border-gold-deep font-medium text-charcoal" : "border-transparent text-charcoal/65 hover:text-charcoal",
                )}
              >
                {label}
                <span className="ml-1.5 text-xs text-charcoal/65">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-center text-charcoal/60">
          {tab === "all"
            ? t.rich("none", {
                gems: (chunks) => <Link href="/gems" className="underline">{chunks}</Link>,
                jewelry: (chunks) => <Link href="/jewelry" className="underline">{chunks}</Link>,
              })
            : t("noneInTab")}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} highlight={order.orderNumber === highlight} />
          ))}
        </div>
      )}
    </div>
  );
}
