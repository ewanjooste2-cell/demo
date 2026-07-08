import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatNumber, formatCompactRand } from "@/lib/format";
import { Card, KpiTile } from "@/components/ui";
import { BarsChart } from "@/components/charts";
import { ListingsMap, type MapListing } from "@/components/listings-map";

const DAY = 24 * 60 * 60 * 1000;

const PERIODS: { key: string; label: string; days: number | null }[] = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = PERIODS.find((p) => p.key === periodParam) ?? PERIODS[2];
  const periodStart = period.days ? new Date(Date.now() - period.days * DAY) : null;

  const user = await getUserOrRedirect();
  const scope = agentScope(user);
  const now = Date.now();

  const [listings, agents, companySold] = await Promise.all([
    prisma.listing.findMany({
      where: scope,
      include: { snapshots: { orderBy: { capturedAt: "asc" } } },
    }),
    prisma.user.findMany({
      where: { role: "AGENT", active: true },
      include: { listings: { select: { status: true, price: true, soldDate: true } } },
    }),
    // Company-wide sales for the leaderboard — every agent sees the full picture.
    prisma.listing.findMany({
      where: { status: "SOLD", ...(periodStart ? { soldDate: { gte: periodStart } } : {}) },
      select: { price: true, agentId: true },
    }),
  ]);

  // --- Listings online -------------------------------------------------------
  const active = listings.filter((l) => l.status === "ACTIVE");
  const underOffer = listings.filter((l) => l.status === "UNDER_OFFER");
  const online = [...active, ...underOffer];
  const portfolioValue = online.reduce((sum, l) => sum + l.price, 0);

  // --- Sales in the selected period (scoped to the signed-in agent) ----------
  const soldInPeriod = listings.filter(
    (l) =>
      l.status === "SOLD" &&
      l.soldDate &&
      (!periodStart || l.soldDate.getTime() >= periodStart.getTime())
  );
  const salesValue = soldInPeriod.reduce((sum, l) => sum + l.price, 0);

  // --- Views KPI ---------------------------------------------------------------
  const totalViews = listings.reduce((sum, l) => sum + (l.snapshots.at(-1)?.views ?? 0), 0);
  let viewsLast30 = 0;
  for (const l of listings) {
    const latest = l.snapshots.at(-1);
    if (!latest) continue;
    const baseline = [...l.snapshots]
      .reverse()
      .find((s) => s.capturedAt.getTime() <= now - 30 * DAY);
    viewsLast30 += latest.views - (baseline?.views ?? 0);
  }

  // --- Sales figures: monthly sold value, last 12 months (scoped) -------------
  const monthlySales: { label: string; value: number }[] = [];
  for (let m = 11; m >= 0; m--) {
    const ref = new Date(now);
    ref.setDate(1);
    ref.setHours(0, 0, 0, 0);
    ref.setMonth(ref.getMonth() - m);
    const next = new Date(ref);
    next.setMonth(next.getMonth() + 1);
    const value = listings
      .filter(
        (l) =>
          l.status === "SOLD" &&
          l.soldDate &&
          l.soldDate.getTime() >= ref.getTime() &&
          l.soldDate.getTime() < next.getTime()
      )
      .reduce((sum, l) => sum + l.price, 0);
    monthlySales.push({
      label: ref.toLocaleDateString("en-ZA", { month: "short" }),
      value,
    });
  }

  // --- Agent leaderboard (company-wide, ranked by sales in period) ------------
  const leaderboard = agents
    .map((a) => {
      const sold = companySold.filter((s) => s.agentId === a.id);
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

  const agentBars = leaderboard.map((a) => ({
    label: a.name.split(" ")[0],
    value: a.salesValue,
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
            Listings and sales across {user.role === "ADMIN" ? "the group" : "your portfolio"}
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
        <KpiTile
          label="Listings online"
          value={formatNumber(online.length)}
          sub={`${active.length} active · ${underOffer.length} under offer`}
        />
        <KpiTile
          label="Portfolio value"
          value={formatCompactRand(portfolioValue)}
          sub={`across ${online.length} live listing${online.length === 1 ? "" : "s"}`}
        />
        <KpiTile
          label={`Sales — ${period.label.toLowerCase()}`}
          value={formatCompactRand(salesValue)}
          sub={`${soldInPeriod.length} propert${soldInPeriod.length === 1 ? "y" : "ies"} sold`}
          subTone="good"
        />
        <KpiTile
          label="Total listing views"
          value={formatNumber(totalViews)}
          sub={`+${formatNumber(viewsLast30)} in the last 30 days`}
          subTone="good"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Sales figures — last 12 months
          </h2>
          <BarsChart data={monthlySales} unit="" currency />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Agent sales — {period.label.toLowerCase()}
          </h2>
          <BarsChart data={agentBars} unit="" currency color="aqua" highlightMax />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            Top agents — {period.label.toLowerCase()}
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

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Listing spread
          </h2>
          <ListingsMap listings={mapListings} />
        </Card>
      </div>
    </div>
  );
}
