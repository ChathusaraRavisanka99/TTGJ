import { prisma } from "@/lib/prisma";
import { BarChart } from "@/components/admin/charts/BarChart";
import { computeProfit, parseDateParam, toDateInputValue } from "@/lib/analytics";
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

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const sp = await searchParams;
  const startOfMonth = monthsAgo(0);
  const sixMonthsAgo = monthsAgo(5);

  // The headline stat cards (revenue, profit, new customers, etc.) use
  // this range — defaulting to the current month, same as before the
  // range picker existed. The 6-month trend chart further down stays
  // fixed regardless of it; a range picker for a trend chart is a
  // different feature (picking how many months of history to show),
  // not this one (picking a period to total up).
  const rangeFrom = parseDateParam(sp.from, false) ?? startOfMonth;
  const rangeTo = parseDateParam(sp.to, true) ?? new Date();
  // Revenue/market-split below reuse this same query for both the fixed
  // 6-month trend chart and the range-driven stat cards - it has to reach
  // back far enough for whichever of the two needs more history, or a
  // `from` older than 6 months would silently undercount the stat cards.
  const ordersQueryFrom = rangeFrom < sixMonthsAgo ? rangeFrom : sixMonthsAgo;

  const [
    paidOrdersLast6Months,
    ordersInRangeByStatus,
    newCustomersInRange,
    pointsIssued,
    pointsRedeemed,
    referralsConverted,
    activeBusinessAccounts,
    soldItemsInRange,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: ordersQueryFrom } },
      select: { paidAt: true, total: true, currency: true, market: true },
    }),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: rangeFrom, lte: rangeTo } }, _count: { _all: true } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: rangeFrom, lte: rangeTo } } }),
    prisma.pointsTransaction.aggregate({ where: { amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.pointsTransaction.aggregate({ where: { reason: "REDEEMED_CHECKOUT" }, _sum: { amount: true } }),
    prisma.referral.count({ where: { status: "REWARDED" } }),
    prisma.businessAccount.count(),
    // Profit is only ever computed from what actually sold (a PAID
    // order's line items), never from raw catalog inventory — an unsold
    // item's cost/retail spread isn't profit, it's just a listed margin.
    prisma.orderItem.findMany({
      where: { order: { status: "PAID", paidAt: { gte: rangeFrom, lte: rangeTo } } },
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
  const inRange = (paidAt: Date | null) => !!paidAt && paidAt >= rangeFrom && paidAt <= rangeTo;
  const intlInRange = paidOrdersLast6Months.filter((o) => o.market !== "lk" && inRange(o.paidAt));
  const lkInRange = paidOrdersLast6Months.filter((o) => o.market === "lk" && inRange(o.paidAt));
  const sum = (orders: { total: number }[]) => orders.reduce((s, o) => s + o.total, 0);

  const monthBuckets = Array.from({ length: 6 }, (_, i) => monthsAgo(5 - i));
  const ordersByMonth = monthBuckets.map((start) => {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const count = paidOrdersLast6Months.filter((o) => o.paidAt && o.paidAt >= start && o.paidAt < end).length;
    return { label: monthLabel(start), value: count };
  });

  const statusChart = ordersInRangeByStatus.map((g) => ({ label: g.status.replaceAll("_", " "), value: g._count._all }));

  const intlProfit = computeProfit(soldItemsInRange, "intl");
  const lkProfit = computeProfit(soldItemsInRange, "lk");
  const marketChart = [
    { label: "International", value: intlInRange.length },
    { label: "Sri Lanka", value: lkInRange.length },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Analytics</h1>
      <p className="mt-1 text-sm text-charcoal/60">The stats below cover the selected range; the trend chart further down always shows the last 6 months.</p>

      <form className="mt-5 flex flex-wrap items-end gap-3" action="/admin/analytics">
        <div>
          <label htmlFor="from" className="block text-xs uppercase tracking-wide text-charcoal/55">From</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={toDateInputValue(rangeFrom)}
            className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm text-charcoal"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs uppercase tracking-wide text-charcoal/55">To</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toDateInputValue(rangeTo)}
            className="mt-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm text-charcoal"
          />
        </div>
        <button type="submit" className="rounded-full border border-charcoal bg-charcoal px-4 py-1.5 text-xs text-ivory">Apply</button>
        <a href="/admin/analytics" className="text-xs text-charcoal/60 underline-offset-2 hover:underline">Reset to this month</a>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="International Revenue" value={formatPrice(sum(intlInRange), "USD")} />
        <StatCard label="Sri Lanka Revenue" value={formatPrice(sum(lkInRange), "LKR")} />
        <StatCard label="Avg. Order Value (Intl)" value={intlInRange.length ? formatPrice(sum(intlInRange) / intlInRange.length, "USD") : "—"} />
        <StatCard label="New Customers" value={String(newCustomersInRange)} />
        <StatCard label="Points Issued (all time)" value={(pointsIssued._sum.amount ?? 0).toLocaleString()} />
        <StatCard label="Points Redeemed (all time)" value={Math.abs(pointsRedeemed._sum.amount ?? 0).toLocaleString()} />
        <StatCard label="Referrals Converted" value={String(referralsConverted)} />
        <StatCard label="Active Business Accounts" value={String(activeBusinessAccounts)} />
        <StatCard
          label="International Profit"
          value={formatPrice(intlProfit.profit, "USD")}
          note={intlProfit.uncostedCount > 0 ? `${intlProfit.uncostedCount} sold item(s) have no cost price set` : undefined}
        />
        <StatCard
          label="Sri Lanka Profit"
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
          <p className="font-serif text-lg text-charcoal">Market Split (selected range)</p>
          <div className="mt-4"><BarChart data={marketChart} /></div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-5 lg:col-span-3">
          <p className="font-serif text-lg text-charcoal">Orders by Status (selected range)</p>
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
