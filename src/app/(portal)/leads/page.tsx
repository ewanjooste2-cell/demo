import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { timeAgo, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/format";
import { Card, LeadStatusBadge, SourceBadge, buttonClass, secondaryButtonClass } from "@/components/ui";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getUserOrRedirect();
  const scope = agentScope(user);

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where: { ...scope, ...(status ? { status } : {}) },
      include: { listing: true, agent: true },
      orderBy: { receivedAt: "desc" },
      take: 200,
    }),
    prisma.lead.groupBy({ by: ["status"], where: scope, _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Leads</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {total} lead{total === 1 ? "" : "s"}
            {user.role !== "ADMIN" && " assigned to you"}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/leads" download className={secondaryButtonClass}>
            Export CSV
          </a>
          <Link href="/leads/new" className={buttonClass}>
            Add lead
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/leads"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            !status ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100" : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
          }`}
        >
          All {total}
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              status === s
                ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
                : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
            }`}
          >
            {LEAD_STATUS_LABELS[s]} {countFor(s)}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/60">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400">
                    {lead.name}
                  </Link>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{lead.email ?? lead.phone ?? "no contact details"}</div>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                  {lead.listing ? (
                    <Link href={`/listings/${lead.listing.id}`} className="hover:text-blue-700 dark:hover:text-blue-400">
                      {lead.listing.suburb} · <span className="font-mono text-xs">{lead.listing.webRef}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{lead.agent?.name ?? "Unassigned"}</td>
                <td className="px-4 py-3">
                  <SourceBadge source={lead.source} />
                </td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  {timeAgo(lead.receivedAt)}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No leads{status ? ` with status "${LEAD_STATUS_LABELS[status] ?? status}"` : ""} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
