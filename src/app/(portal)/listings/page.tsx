import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { formatRand, formatNumber } from "@/lib/format";
import { Card, ListingStatusBadge, buttonClass } from "@/components/ui";

export default async function ListingsPage() {
  const user = await getUserOrRedirect();

  const listings = await prisma.listing.findMany({
    where: agentScope(user),
    include: {
      agent: true,
      snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
      _count: { select: { leads: true } },
    },
    orderBy: { listedDate: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Listings</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
            {user.role !== "ADMIN" && " assigned to you"}
          </p>
        </div>
        <Link href="/listings/new" className={buttonClass}>
          Add listing
        </Link>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Web ref</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100">
                  {formatNumber(l.snapshots[0]?.views ?? 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100">{l._count.leads}</td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
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
