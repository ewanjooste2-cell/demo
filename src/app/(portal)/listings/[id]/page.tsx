import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatRand, formatNumber, formatDate, timeAgo } from "@/lib/format";
import { Card, KpiTile, ListingStatusBadge, LeadStatusBadge, secondaryButtonClass } from "@/components/ui";
import { TrendChart } from "@/components/charts";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserOrRedirect();

  const listing = await prisma.listing.findFirst({
    where: { id, ...agentScope(user) },
    include: {
      agent: true,
      snapshots: { orderBy: { capturedAt: "asc" } },
      leads: { orderBy: { receivedAt: "desc" }, take: 20 },
    },
  });
  if (!listing) notFound();

  const latest = listing.snapshots.at(-1);
  const previous = listing.snapshots.at(-2);
  const viewsDelta = latest && previous ? latest.views - previous.views : null;

  const trend = listing.snapshots.map((s) => ({
    label: new Date(s.capturedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
    value: s.views,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-stone-900">{listing.title}</h1>
            <ListingStatusBadge status={listing.status} />
          </div>
          <p className="text-sm text-stone-500 mt-1">
            {listing.address}, {listing.suburb} · Web ref{" "}
            <span className="font-mono">{listing.webRef}</span> · Listed {formatDate(listing.listedDate)}
            {listing.agent && <> · {listing.agent.name}</>}
          </p>
        </div>
        <div className="flex gap-2">
          {listing.url && (
            <a href={listing.url} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
              View on Private Property ↗
            </a>
          )}
          <Link href={`/listings/${listing.id}/edit`} className={secondaryButtonClass}>
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Asking price" value={formatRand(listing.price)} />
        <KpiTile
          label="Total views"
          value={formatNumber(latest?.views ?? 0)}
          sub={viewsDelta != null ? `+${formatNumber(viewsDelta)} since previous report` : undefined}
          subTone="good"
        />
        <KpiTile label="Alerts sent" value={formatNumber(latest?.alertsSent ?? 0)} />
        <KpiTile label="Leads" value={formatNumber(listing.leads.length)} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 mb-3">Cumulative views over time</h2>
        {trend.length > 1 ? (
          <TrendChart data={trend} unit="views" />
        ) : (
          <p className="text-sm text-stone-500 py-8 text-center">
            Not enough report data yet — import a Private Property report to start the trend.
          </p>
        )}
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-700">Leads on this listing</h2>
          <Link href="/leads" className="text-sm text-blue-700 hover:underline">
            All leads
          </Link>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {listing.leads.map((lead) => (
              <tr key={lead.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-5 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-stone-900 hover:text-blue-700">
                    {lead.name}
                  </Link>
                  <div className="text-xs text-stone-500">{lead.email ?? lead.phone ?? ""}</div>
                </td>
                <td className="px-5 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3 text-right text-xs text-stone-500">{timeAgo(lead.receivedAt)}</td>
              </tr>
            ))}
            {listing.leads.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-stone-500">No leads on this listing yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
