import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatNumber, formatCompactRand } from "@/lib/format";
import { Card, StatTile } from "@/components/ui";
import { BarsChart, GroupedBarsChart } from "@/components/charts";
import { ListingsMap, type MapListing } from "@/components/listings-map";
import Link from "next/link";
import { DateRangePicker } from "@/components/date-range";
import { RANGE_PRESETS } from "@/lib/ranges";
import { formatRand, DEAL_STAGE_LABELS } from "@/lib/format";
import { markPayoutPaid } from "./finance/actions";

const DAY = 24 * 60 * 60 * 1000;

/** Percent change vs the prior window; null when either side has no signal. */
function pctChange(current: number | null, prior: number | null) {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

type Range = {
  key: string; // preset key or "custom"
  label: string; // trigger-button label
  sub: string; // header line under the title
  start: number | null; // null = all time
  end: number;
  from?: string; // custom bounds, echoed back to the picker inputs
  to?: string;
};

function formatDay(t: number) {
  return new Date(t).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/** Resolve ?period= presets or a ?from=/&to= custom window into [start, end]. */
function resolveRange(
  params: { period?: string; from?: string; to?: string },
  now: number
): Range {
  const parseDay = (s?: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const t = new Date(`${s}T00:00:00`).getTime();
    return Number.isNaN(t) ? null : t;
  };

  const from = parseDay(params.from);
  if (from != null) {
    const toStart = parseDay(params.to);
    // The "to" day is inclusive: extend to the end of that day, capped at now.
    let start = from;
    let end = toStart != null ? Math.min(toStart + DAY - 1, now) : now;
    if (end < start) [start, end] = [end - DAY + 1, start + DAY - 1];
    const days = Math.max(1, Math.round((end - start) / DAY));
    return {
      key: "custom",
      label: `${formatDay(start)} – ${formatDay(end)}`,
      sub: `Custom range · change vs the preceding ${days} days`,
      start,
      end,
      from: params.from,
      to: params.to,
    };
  }

  const key = params.period ?? "365";
  const preset = RANGE_PRESETS.find((p) => p.key === key) ?? RANGE_PRESETS[4];
  const startOf = (fn: (d: Date) => void) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    fn(d);
    return d.getTime();
  };
  const start =
    preset.key === "all"
      ? null
      : preset.key === "mtd"
        ? startOf((d) => d.setDate(1))
        : preset.key === "ytd"
          ? startOf((d) => d.setMonth(0, 1))
          : now - Number(preset.key) * DAY;
  return {
    key: preset.key,
    label: preset.label,
    sub:
      start == null
        ? "All time"
        : `${preset.label} · change vs the preceding ${Math.max(1, Math.round((now - start) / DAY))} days`,
    start,
    end: now,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = Date.now();
  const range = resolveRange(params, now);
  const { start, end } = range;
  const priorStart = start != null ? start - (end - start) : null;

  const inPeriod = (t: Date) =>
    (start == null || t.getTime() >= start) && t.getTime() <= end;
  const inPrior = (t: Date) =>
    start != null && t.getTime() >= priorStart! && t.getTime() < start;

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

  const deals = await prisma.deal.findMany({
    include: {
      listing: { select: { title: true, webRef: true } },
      agent: { select: { name: true } },
    },
    orderBy: { openedAt: "desc" },
  });

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

  // --- Deal-room finance: pipeline commission, splits and payouts -------------------
  const dealGross = (d: { salePrice: number; commissionPct: number }) =>
    Math.round((d.salePrice * d.commissionPct) / 100);
  const dealAgentShare = (d: { salePrice: number; commissionPct: number; agentSplitPct: number }) =>
    Math.round((dealGross(d) * d.agentSplitPct) / 100);
  const pipelineCommission = deals
    .filter((d) => d.stage !== "REGISTERED")
    .reduce((s, d) => s + dealGross(d), 0);
  const payoutsDue = deals
    .filter((d) => d.stage === "REGISTERED" && d.payoutStatus === "PENDING")
    .reduce((s, d) => s + dealAgentShare(d), 0);

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
          <p className="text-sm text-stone-500 dark:text-stone-400">{range.sub}</p>
        </div>
        <DateRangePicker
          selectedKey={range.key}
          label={range.label}
          from={range.from}
          to={range.to}
        />
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
          sub={`net ${formatCompactRand(commission - support)} after support · ${formatCompactRand(pipelineCommission)} in pipeline`}
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

      <Card className="overflow-x-auto">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Commission ledger
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {formatCompactRand(pipelineCommission)} in pipeline
            {payoutsDue > 0 && ` · ${formatCompactRand(payoutsDue)} payouts due`}
          </span>
        </div>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-5 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium text-right">Gross comm.</th>
              <th className="px-4 py-3 font-medium text-right">Agent share</th>
              <th className="px-4 py-3 font-medium text-right">Brokerage net</th>
              <th className="px-4 py-3 font-medium">Payout</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const g = dealGross(d);
              const a = dealAgentShare(d);
              return (
                <tr key={d.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      {d.listing.title}
                    </Link>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{d.listing.webRef}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                    {d.agent?.name ?? "—"}
                    <span className="text-xs text-stone-400 dark:text-stone-500"> · {d.agentSplitPct}%</span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                    {DEAL_STAGE_LABELS[d.stage]}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100 whitespace-nowrap">
                    {formatRand(g)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400 whitespace-nowrap">
                    {formatRand(a)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100 whitespace-nowrap">
                    {formatRand(g - a)}
                  </td>
                  <td className="px-4 py-3">
                    {d.stage !== "REGISTERED" ? (
                      <span className="text-xs text-stone-400 dark:text-stone-500">awaiting registration</span>
                    ) : d.payoutStatus === "PAID" ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                        Paid
                      </span>
                    ) : user.role === "ADMIN" ? (
                      <form action={markPayoutPaid.bind(null, d.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          Mark paid
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-amber-700 dark:text-amber-400">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {deals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-stone-500 dark:text-stone-400">
                  No deals in the ledger yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Listing spread
        </h2>
        <ListingsMap listings={mapListings} />
      </Card>
    </div>
  );
}
