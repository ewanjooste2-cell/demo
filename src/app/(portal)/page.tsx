import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatNumber, formatCompactRand } from "@/lib/format";
import { Card, StatTile } from "@/components/ui";
import { BarsChart, GroupedBarsChart } from "@/components/charts";
import { ListingsMap, type MapListing } from "@/components/listings-map";

const DAY = 24 * 60 * 60 * 1000;

const PERIODS: { key: string; label: string; days: number | null }[] = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
];

/** Percent change vs the prior window; null when either side has no signal. */
function pctChange(current: number | null, prior: number | null) {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = PERIODS.find((p) => p.key === periodParam) ?? PERIODS[2];
  const now = Date.now();
  const periodStart = period.days ? now - period.days * DAY : null;
  const priorStart = period.days ? now - 2 * period.days * DAY : null;

  const inPeriod = (t: Date) => periodStart == null || t.getTime() >= periodStart;
  const inPrior = (t: Date) =>
    periodStart != null && t.getTime() >= priorStart! && t.getTime() < periodStart;

  const user = await getUserOrRedirect();
  const scope = agentScope(user);

  // Small tables are fetched whole; both the current and prior window are
  // sliced in memory so every KPI can show change vs the previous period.
  const [listings, agents, companySold, presentations, agentCosts, marketingSpend, wonLeads] =
    await Promise.all([
      prisma.listing.findMany({
        where: scope,
        include: { snapshots: { orderBy: { capturedAt: "asc" } } },
      }),
      prisma.user.findMany({
        where: { role: "AGENT", active: true },
        include: { listings: { select: { status: true, price: true, soldDate: true } } },
      }),
      // Company-wide sales — every agent sees the full picture.
      prisma.listing.findMany({
        where: { status: "SOLD", soldDate: { not: null } },
        select: { price: true, agentId: true, commissionPct: true, soldDate: true },
      }),
      prisma.presentation.findMany({ select: { agentId: true, outcome: true, heldAt: true } }),
      prisma.agentCost.findMany({ select: { agentId: true, amount: true, month: true } }),
      prisma.marketingSpend.findMany({ select: { month: true, amount: true } }),
      prisma.lead.findMany({ where: { status: "WON" }, select: { receivedAt: true } }),
    ]);

  // --- Listings online ---------------------------------------------------------
  const active = listings.filter((l) => l.status === "ACTIVE");
  const underOffer = listings.filter((l) => l.status === "UNDER_OFFER");
  const online = [...active, ...underOffer];
  const portfolioValue = online.reduce((sum, l) => sum + l.price, 0);

  // --- Sales (scoped to the signed-in agent) ------------------------------------
  const soldListings = listings.filter((l) => l.status === "SOLD" && l.soldDate);
  const soldInPeriod = soldListings.filter((l) => inPeriod(l.soldDate!));
  const soldInPrior = soldListings.filter((l) => inPrior(l.soldDate!));
  const salesValue = soldInPeriod.reduce((sum, l) => sum + l.price, 0);
  const salesDelta = pctChange(
    salesValue,
    soldInPrior.reduce((sum, l) => sum + l.price, 0) || null
  );

  // --- Views ---------------------------------------------------------------------
  const totalViews = listings.reduce((sum, l) => sum + (l.snapshots.at(-1)?.views ?? 0), 0);
  let viewsLast30 = 0;
  let viewsPrior30 = 0;
  for (const l of listings) {
    const latest = l.snapshots.at(-1);
    if (!latest) continue;
    const at = (cutoff: number) =>
      [...l.snapshots].reverse().find((s) => s.capturedAt.getTime() <= cutoff)?.views ?? 0;
    const b30 = at(now - 30 * DAY);
    const b60 = at(now - 60 * DAY);
    viewsLast30 += latest.views - b30;
    viewsPrior30 += b30 - b60;
  }
  const viewsDelta = pctChange(viewsLast30, viewsPrior30 || null);

  // --- Days on market: listed → sold ---------------------------------------------
  const domDays = (l: { listedDate: Date; soldDate: Date | null }) =>
    (l.soldDate!.getTime() - l.listedDate.getTime()) / DAY;
  const avg = (values: number[]) =>
    values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
  const avgDom = avg(soldInPeriod.map(domDays));
  const domDelta = pctChange(avgDom, avg(soldInPrior.map(domDays)));

  // --- Mandate conversion: presentations → signed mandates ------------------------
  const presInPeriod = presentations.filter((p) => inPeriod(p.heldAt));
  const signed = presInPeriod.filter((p) => p.outcome === "SIGNED").length;
  const conversionRate = presInPeriod.length ? signed / presInPeriod.length : null;
  const priorPres = presentations.filter((p) => inPrior(p.heldAt));
  const priorRate = priorPres.length
    ? priorPres.filter((p) => p.outcome === "SIGNED").length / priorPres.length
    : null;
  const conversionDelta = pctChange(conversionRate, priorRate);

  // --- Agent economics: commission earned vs support cost -------------------------
  const commissionOf = (rows: typeof companySold) =>
    Math.round(rows.reduce((sum, s) => sum + (s.price * s.commissionPct) / 100, 0));
  const soldCompanyPeriod = companySold.filter((s) => inPeriod(s.soldDate!));
  const commission = commissionOf(soldCompanyPeriod);
  const commissionDelta = pctChange(
    commission,
    commissionOf(companySold.filter((s) => inPrior(s.soldDate!))) || null
  );
  const support = agentCosts.filter((c) => inPeriod(c.month)).reduce((s, c) => s + c.amount, 0);
  const priorSupport = agentCosts
    .filter((c) => inPrior(c.month))
    .reduce((s, c) => s + c.amount, 0);
  const profitPerAgent = agents.length ? (commission - support) / agents.length : null;
  const priorCommission = commissionOf(companySold.filter((s) => inPrior(s.soldDate!)));
  const profitDelta = pctChange(
    profitPerAgent,
    agents.length && (priorCommission || priorSupport)
      ? (priorCommission - priorSupport) / agents.length
      : null
  );

  // --- Customer acquisition cost ---------------------------------------------------
  const spendIn = (test: (t: Date) => boolean) =>
    marketingSpend.filter((s) => test(s.month)).reduce((sum, s) => sum + s.amount, 0);
  const clientsIn = (test: (t: Date) => boolean) =>
    wonLeads.filter((l) => test(l.receivedAt)).length;
  const spend = spendIn(inPeriod);
  const clients = clientsIn(inPeriod);
  const cac = clients > 0 ? spend / clients : null;
  const priorClients = clientsIn(inPrior);
  const cacDelta = pctChange(cac, priorClients > 0 ? spendIn(inPrior) / priorClients : null);

  // --- Monthly series: sales chart + tile sparklines --------------------------------
  const monthlySales: { label: string; value: number }[] = [];
  const monthlyDom: (number | null)[] = [];
  const monthlyCac: (number | null)[] = [];
  for (let m = 11; m >= 0; m--) {
    const ref = new Date(now);
    ref.setDate(1);
    ref.setHours(0, 0, 0, 0);
    ref.setMonth(ref.getMonth() - m);
    const next = new Date(ref);
    next.setMonth(next.getMonth() + 1);
    const inMonth = (t: Date) => t.getTime() >= ref.getTime() && t.getTime() < next.getTime();

    const soldInMonth = soldListings.filter((l) => inMonth(l.soldDate!));
    monthlySales.push({
      label: ref.toLocaleDateString("en-ZA", { month: "short" }),
      value: soldInMonth.reduce((sum, l) => sum + l.price, 0),
    });
    const domAvg = avg(soldInMonth.map(domDays));
    monthlyDom.push(domAvg != null ? Math.round(domAvg) : null);
    const monthClients = clientsIn(inMonth);
    monthlyCac.push(monthClients > 0 ? Math.round(spendIn(inMonth) / monthClients) : null);
  }

  // --- Agent leaderboard (company-wide, ranked by sales in period) ------------------
  const leaderboard = agents
    .map((a) => {
      const sold = soldCompanyPeriod.filter((s) => s.agentId === a.id);
      return {
        id: a.id,
        name: a.name,
        salesValue: sold.reduce((sum, s) => sum + s.price, 0),
        salesCount: sold.length,
        activeCount: a.listings.filter((l) => l.status === "ACTIVE" || l.status === "UNDER_OFFER")
          .length,
      };
    })
    .sort((a, b) => b.salesValue - a.salesValue || b.salesCount - a.salesCount);
  const topSales = leaderboard[0]?.salesValue || 1;

  const presentationBars = leaderboard.map((a) => {
    const held = presInPeriod.filter((p) => p.agentId === a.id);
    return {
      label: a.name.split(" ")[0],
      a: held.length,
      b: held.filter((p) => p.outcome === "SIGNED").length,
    };
  });

  const commissionBars = leaderboard.map((a) => ({
    label: a.name.split(" ")[0],
    a: commissionOf(soldCompanyPeriod.filter((s) => s.agentId === a.id)),
    b: agentCosts
      .filter((c) => c.agentId === a.id && inPeriod(c.month))
      .reduce((sum, c) => sum + c.amount, 0),
  }));

  // --- Map ---------------------------------------------------------------------
  const mapListings: MapListing[] = listings
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => ({
      id: l.id,
      title: l.title,
      suburb: l.suburb,
      status: l.status,
      price: l.price,
      latitude: l.latitude!,
      longitude: l.longitude!,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {user.role === "ADMIN" ? "Group dashboard" : `Welcome back, ${user.name.split(" ")[0]}`}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {period.days
              ? `Last ${period.label.toLowerCase()} · change vs the previous ${period.label.toLowerCase()}`
              : "All time"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={p.key === "365" ? "/" : `/?period=${p.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                p.key === period.key
                  ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Sales"
          value={formatCompactRand(salesValue)}
          delta={salesDelta != null ? { pct: salesDelta } : null}
          sub={`${soldInPeriod.length} propert${soldInPeriod.length === 1 ? "y" : "ies"} sold`}
          spark={monthlySales.map((s) => s.value)}
          href="/listings?status=SOLD"
        />
        <StatTile
          label="Live portfolio"
          value={formatCompactRand(portfolioValue)}
          sub={`${online.length} listings · ${underOffer.length} under offer`}
          href="/listings"
        />
        <StatTile
          label="Commission"
          value={formatCompactRand(commission)}
          delta={commissionDelta != null ? { pct: commissionDelta } : null}
          sub={`net ${formatCompactRand(commission - support)} after support`}
        />
        <StatTile
          label="Listing views"
          value={formatNumber(totalViews)}
          delta={viewsDelta != null ? { pct: viewsDelta } : null}
          sub={`+${formatNumber(viewsLast30)} in the last 30 days`}
          href="/listings"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Days on market"
          value={avgDom != null ? `${Math.round(avgDom)}` : "—"}
          delta={domDelta != null ? { pct: domDelta, goodWhenDown: true } : null}
          sub="listed to sold"
          spark={monthlyDom}
        />
        <StatTile
          label="Mandate conversion"
          value={conversionRate != null ? `${Math.round(conversionRate * 100)}%` : "—"}
          delta={conversionDelta != null ? { pct: conversionDelta } : null}
          sub={`${signed} of ${presInPeriod.length} presentations signed`}
        />
        <StatTile
          label="Profit per agent"
          value={profitPerAgent != null ? formatCompactRand(Math.round(profitPerAgent)) : "—"}
          delta={profitDelta != null ? { pct: profitDelta } : null}
          sub={`after ${formatCompactRand(support)} support costs`}
        />
        <StatTile
          label="Acquisition cost"
          value={cac != null ? formatCompactRand(Math.round(cac)) : "—"}
          delta={cacDelta != null ? { pct: cacDelta, goodWhenDown: true } : null}
          sub={`${clients} client${clients === 1 ? "" : "s"} won`}
          spark={monthlyCac}
          href="/leads?status=WON"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Sales — last 12 months
          </h2>
          <BarsChart data={monthlySales} unit="" currency />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Mandate conversion by agent
          </h2>
          <GroupedBarsChart
            data={presentationBars}
            seriesA="Presentations held"
            seriesB="Mandates signed"
          />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Agent economics — commission vs support cost
          </h2>
          <GroupedBarsChart
            data={commissionBars}
            seriesA="Commission earned"
            seriesB="Support cost"
            currency
          />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            Top agents
          </h2>
          <ol className="space-y-4">
            {leaderboard.map((a, i) => (
              <li key={a.id}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    <span className="inline-block w-5 text-stone-400 dark:text-stone-600 tabular-nums">
                      {i + 1}.
                    </span>
                    {a.name}
                  </span>
                  <span className="text-sm tabular-nums text-stone-600 dark:text-stone-400 shrink-0">
                    {formatCompactRand(a.salesValue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden ml-5">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max(3, (a.salesValue / topSales) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-5">
                  {a.salesCount} sale{a.salesCount === 1 ? "" : "s"} · {a.activeCount} listing
                  {a.activeCount === 1 ? "" : "s"} online
                </div>
              </li>
            ))}
            {leaderboard.length === 0 && (
              <li className="text-sm text-stone-500 dark:text-stone-400">No agents yet.</li>
            )}
          </ol>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Listing spread
        </h2>
        <ListingsMap listings={mapListings} />
      </Card>
    </div>
  );
}
