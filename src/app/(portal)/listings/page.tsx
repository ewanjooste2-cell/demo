import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import {
  formatRand,
  formatNumber,
  LISTING_STATUSES,
  LISTING_STATUS_LABELS,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
} from "@/lib/format";
import { Card, ListingStatusBadge, buttonClass, secondaryButtonClass } from "@/components/ui";

export const metadata = { title: "Listings" };

const pillClass = (selected: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium border ${
    selected
      ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
  }`;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getUserOrRedirect();
  const scope = agentScope(user);

  const [listings, counts, dealCounts] = await Promise.all([
    prisma.listing.findMany({
      where: { ...scope, ...(status ? { status } : {}) },
      include: {
        agent: true,
        snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
        _count: { select: { leads: true } },
        deals: { orderBy: { openedAt: "desc" }, take: 1 },
      },
      orderBy: { listedDate: "desc" },
    }),
    prisma.listing.groupBy({ by: ["status"], where: scope, _count: true }),
    prisma.deal.groupBy({ by: ["stage"], _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);
  const dealCountFor = (s: string) => dealCounts.find((c) => c.stage === s)?._count ?? 0;
  const dealsTotal = dealCounts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Listings &amp; deals
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
            {user.role !== "ADMIN" && " assigned to you"}
            {dealsTotal > 0 && ` · ${dealsTotal} deal${dealsTotal === 1 ? "" : "s"} in the pipeline`}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/listings" download className={secondaryButtonClass}>
            Export CSV
          </a>
          <Link href="/listings/new" className={buttonClass}>
            Add listing
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/listings" className={pillClass(!status)}>
          All {total}
        </Link>
        {LISTING_STATUSES.filter((s) => countFor(s) > 0).map((s) => (
          <Link key={s} href={`/listings?status=${s}`} className={pillClass(status === s)}>
            {LISTING_STATUS_LABELS[s]} {countFor(s)}
          </Link>
        ))}
      </div>

      {dealsTotal > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DEAL_STAGES.map((s) => (
            <div
              key={s}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2"
            >
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {DEAL_STAGE_LABELS[s]}
              </div>
              <div className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {dealCountFor(s)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Web ref</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium text-right">Views</th>
              <th className="px-4 py-3 font-medium text-right">Leads</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/60">
                <td className="px-4 py-3">
                  <Link href={`/listings/${l.id}`} className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400">
                    {l.title}
                  </Link>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {l.address}, {l.suburb}
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 font-mono text-xs">{l.webRef}</td>
                <td className="px-4 py-3 text-stone-900 dark:text-stone-100 whitespace-nowrap">{formatRand(l.price)}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{l.agent?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <ListingStatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3">
                  {l.deals[0] ? (
                    <Link
                      href={`/deals/${l.deals[0].id}`}
                      className="group inline-block"
                      title={`Open deal room — ${DEAL_STAGE_LABELS[l.deals[0].stage]}`}
                    >
                      <span className="flex items-center gap-0.5 w-20">
                        {DEAL_STAGES.map((s, i) => (
                          <span
                            key={s}
                            className={`h-1.5 flex-1 rounded-full ${
                              i <= DEAL_STAGES.indexOf(l.deals[0].stage as (typeof DEAL_STAGES)[number])
                                ? "bg-blue-600"
                                : "bg-stone-200 dark:bg-stone-700"
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {DEAL_STAGE_LABELS[l.deals[0].stage]}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100">
                  {formatNumber(l.snapshots[0]?.views ?? 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100">{l._count.leads}</td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No listings yet. Add your first listing to start tracking engagement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
