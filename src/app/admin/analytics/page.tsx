import { prisma } from "@/lib/prisma";
import { BarChart } from "@/components/admin/charts/BarChart";
import { computeProfit } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short" });
}

export default async function AdminAnalyticsPage() {
  const startOfMonth = monthsAgo(0);
  const sixMonthsAgo = monthsAgo(5);

  const [
    paidOrdersLast6Months,
    ordersThisMonthByStatus,
    newCustomersThisMonth,
    pointsIssued,
    pointsRedeemed,
    referralsConverted,
    activeBusinessAccounts,
    soldItemsThisMonth,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: sixMonthsAgo } },
      select: { paidAt: true, total: true, currency: true, market: true },
    }),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: startOfMonth } }, _count: { _all: true } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } } }),
    prisma.pointsTransaction.aggregate({ where: { amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.pointsTransaction.aggregate({ where: { reason: "REDEEMED_CHECKOUT" }, _sum: { amount: true } }),
    prisma.referral.count({ where: { status: "REWARDED" } }),
    prisma.businessAccount.count(),
    // Profit is only ever computed from what actually sold (a PAID
    // order's line items), never from raw catalog inventory — an unsold
    // item's cost/retail spread isn't profit, it's just a listed margin.
    prisma.orderItem.findMany({
      where: { order: { status: "PAID", paidAt: { gte: startOfMonth } } },
      select: {
        quantity: true,
        lineTotal: true,
        order: { select: { market: true } },
        gemstone: { select: { costPrice: true } },
        jewelry: { select: { costPrice: true } },
      },
    }),
  ]);

  // Revenue is currency-specific (the international site charges USD, the
  // Sri Lanka store LKR — this app never sums the two, same discipline
  // lib/checkout.ts follows), so every revenue figure here is split by
  // market rather than blended into one misleading total.
  const intlOrders = paidOrdersLast6Months.filter((o) => o.market !== "lk");
  const lkOrders = paidOrdersLast6Months.filter((o) => o.market === "lk");
  const intlThisMonth = intlOrders.filter((o) => (o.paidAt ?? new Date(0)) >= startOfMonth);
  const lkThisMonth = lkOrders.filter((o) => (o.paidAt ?? new Date(0)) >= startOfMonth);
  const sum = (orders: { total: number }[]) => orders.reduce((s, o) => s + o.total, 0);

  const monthBuckets = Array.from({ length: 6 }, (_, i) => monthsAgo(5 - i));
  const ordersByMonth = monthBuckets.map((start) => {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const count = paidOrdersLast6Months.filter((o) => o.paidAt && o.paidAt >= start && o.paidAt < end).length;
    return { label: monthLabel(start), value: count };
  });

  const statusChart = ordersThisMonthByStatus.map((g) => ({ label: g.status.replaceAll("_", " "), value: g._count._all }));

  const intlProfit = computeProfit(soldItemsThisMonth, "intl");
  const lkProfit = computeProfit(soldItemsThisMonth, "lk");
  const marketChart = [
    { label: "International", value: intlThisMonth.length },
    { label: "Sri Lanka", value: lkThisMonth.length },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Analytics</h1>
      <p className="mt-1 text-sm text-charcoal/60">This month, and the last 6 months of paid orders.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="International Revenue (this month)" value={formatPrice(sum(intlThisMonth), "USD")} />
        <StatCard label="Sri Lanka Revenue (this month)" value={formatPrice(sum(lkThisMonth), "LKR")} />
        <StatCard label="Avg. Order Value (Intl)" value={intlThisMonth.length ? formatPrice(sum(intlThisMonth) / intlThisMonth.length, "USD") : "—"} />
        <StatCard label="New Customers (this month)" value={String(newCustomersThisMonth)} />
        <StatCard label="Points Issued (all time)" value={(pointsIssued._sum.amount ?? 0).toLocaleString()} />
        <StatCard label="Points Redeemed (all time)" value={Math.abs(pointsRedeemed._sum.amount ?? 0).toLocaleString()} />
        <StatCard label="Referrals Converted" value={String(referralsConverted)} />
        <StatCard label="Active Business Accounts" value={String(activeBusinessAccounts)} />
        <StatCard
          label="International Profit (this month)"
          value={formatPrice(intlProfit.profit, "USD")}
          note={intlProfit.uncostedCount > 0 ? `${intlProfit.uncostedCount} sold item(s) have no cost price set` : undefined}
        />
        <StatCard
          label="Sri Lanka Profit (this month)"
          value={formatPrice(lkProfit.profit, "LKR")}
          note={lkProfit.uncostedCount > 0 ? `${lkProfit.uncostedCount} sold item(s) have no cost price set` : undefined}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface p-5 lg:col-span-2">
          <p className="font-serif text-lg text-charcoal">Paid Orders — Last 6 Months</p>
          <div className="mt-4"><BarChart data={ordersByMonth} /></div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <p className="font-serif text-lg text-charcoal">Market Split (this month)</p>
          <div className="mt-4"><BarChart data={marketChart} /></div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-5 lg:col-span-3">
          <p className="font-serif text-lg text-charcoal">Orders by Status (this month)</p>
          <div className="mt-4"><BarChart data={statusChart} /></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-2xl text-charcoal">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/55">{label}</p>
      {note && <p className="mt-1.5 text-xs text-amber-700">{note}</p>}
    </div>
  );
}
