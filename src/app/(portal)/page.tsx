import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatNumber, timeAgo } from "@/lib/format";
import { Card, KpiTile, LeadStatusBadge } from "@/components/ui";
import { TrendChart, BarsChart } from "@/components/charts";

const DAY = 24 * 60 * 60 * 1000;

function shortDate(d: Date) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const user = await getUserOrRedirect();
  const scope = agentScope(user);
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * DAY);

  const [listings, recentLeads, newLeadCount, leadsLast30, leadsForChart] = await Promise.all([
    prisma.listing.findMany({
      where: scope,
      include: { agent: true, snapshots: { orderBy: { capturedAt: "asc" } } },
    }),
    prisma.lead.findMany({
      where: scope,
      include: { listing: true },
      orderBy: { receivedAt: "desc" },
      take: 6,
    }),
    prisma.lead.count({ where: { ...scope, status: "NEW" } }),
    prisma.lead.count({ where: { ...scope, receivedAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.findMany({
      where: { ...scope, receivedAt: { gte: new Date(now - 56 * DAY) } },
      select: { receivedAt: true, agentId: true },
    }),
  ]);

  // --- KPI numbers -----------------------------------------------------------
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const totalViews = listings.reduce((sum, l) => sum + (l.snapshots.at(-1)?.views ?? 0), 0);

  // Views gained in the last ~30 days: latest cumulative minus the snapshot
  // closest to 30 days back, per listing.
  let viewsLast30 = 0;
  for (const l of listings) {
    const latest = l.snapshots.at(-1);
    if (!latest) continue;
    const baseline = [...l.snapshots]
      .reverse()
      .find((s) => s.capturedAt.getTime() <= now - 30 * DAY);
    viewsLast30 += latest.views - (baseline?.views ?? 0);
  }

  // --- Views trend: total cumulative views per report date (carry forward) ----
  const dates = [...new Set(listings.flatMap((l) => l.snapshots.map((s) => s.capturedAt.getTime())))]
    .sort((a, b) => a - b)
    .slice(-12);
  const viewsTrend = dates.map((t) => {
    let total = 0;
    for (const l of listings) {
      const upto = l.snapshots.filter((s) => s.capturedAt.getTime() <= t).at(-1);
      total += upto?.views ?? 0;
    }
    return { label: shortDate(new Date(t)), value: total };
  });

  // --- Leads per week (last 8 weeks) ------------------------------------------
  const leadsPerWeek: { label: string; value: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * DAY;
    const end = now - w * 7 * DAY;
    leadsPerWeek.push({
      label: shortDate(new Date(end)),
      value: leadsForChart.filter(
        (l) => l.receivedAt.getTime() > start && l.receivedAt.getTime() <= end
      ).length,
    });
  }

  // --- Top listings by views ---------------------------------------------------
  const topListings = [...listings]
    .map((l) => ({ l, views: l.snapshots.at(-1)?.views ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const maxTopViews = topListings[0]?.views || 1;

  // --- Per-agent leads (admin only) --------------------------------------------
  let agentBars: { label: string; value: number }[] = [];
  if (user.role === "ADMIN") {
    const agents = await prisma.user.findMany({ where: { role: "AGENT", active: true } });
    agentBars = agents.map((a) => ({
      label: a.name.split(" ")[0],
      value: leadsForChart.filter((l) => l.agentId === a.id).length,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">
          {user.role === "ADMIN" ? "Group dashboard" : `Welcome back, ${user.name.split(" ")[0]}`}
        </h1>
        <p className="text-sm text-stone-500">
          Engagement across {user.role === "ADMIN" ? "all" : "your"} Private Property listings
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Active listings" value={formatNumber(activeCount)} sub={`${listings.length} total`} />
        <KpiTile
          label="Total listing views"
          value={formatNumber(totalViews)}
          sub={`+${formatNumber(viewsLast30)} in the last 30 days`}
          subTone="good"
        />
        <KpiTile label="Leads (last 30 days)" value={formatNumber(leadsLast30)} />
        <KpiTile
          label="New leads to action"
          value={formatNumber(newLeadCount)}
          sub={newLeadCount > 0 ? "Waiting for first contact" : "All caught up"}
          subTone={newLeadCount > 0 ? "bad" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Total views over time</h2>
          {viewsTrend.length > 1 ? (
            <TrendChart data={viewsTrend} unit="views" />
          ) : (
            <p className="text-sm text-stone-500 py-8 text-center">
              Import a Private Property report to start tracking views.
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Leads per week</h2>
          <BarsChart data={leadsPerWeek} unit="leads" color="aqua" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-4">Most viewed listings</h2>
          <ul className="space-y-3">
            {topListings.map(({ l, views }) => (
              <li key={l.id}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <Link
                    href={`/listings/${l.id}`}
                    className="text-sm font-medium text-stone-900 hover:text-blue-700 truncate"
                  >
                    {l.title}
                  </Link>
                  <span className="text-sm tabular-nums text-stone-600 shrink-0">
                    {formatNumber(views)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max(4, (views / maxTopViews) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
            {topListings.length === 0 && (
              <li className="text-sm text-stone-500">No listings yet.</li>
            )}
          </ul>
        </Card>

        {user.role === "ADMIN" ? (
          <Card className="p-5">
            <h2 className="text-sm font-medium text-stone-700 mb-3">Leads per agent (last 8 weeks)</h2>
            <BarsChart data={agentBars} unit="leads" highlightMax />
          </Card>
        ) : (
          <Card className="p-5">
            <h2 className="text-sm font-medium text-stone-700 mb-3">Latest leads</h2>
            <ul className="divide-y divide-stone-100">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-stone-900 hover:text-blue-700">
                      {lead.name}
                    </Link>
                    <div className="text-xs text-stone-500 truncate">
                      {lead.listing?.title ?? "No listing linked"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <LeadStatusBadge status={lead.status} />
                    <span className="text-xs text-stone-500">{timeAgo(lead.receivedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {user.role === "ADMIN" && (
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Latest leads</h2>
          <ul className="divide-y divide-stone-100">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-stone-900 hover:text-blue-700">
                    {lead.name}
                  </Link>
                  <div className="text-xs text-stone-500 truncate">
                    {lead.listing?.title ?? "No listing linked"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <LeadStatusBadge status={lead.status} />
                  <span className="text-xs text-stone-500">{timeAgo(lead.receivedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
