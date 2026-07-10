import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { timeAgo, HUNT_STATUSES, HUNT_STATUS_LABELS, formatCompactRand } from "@/lib/format";
import { Card, HuntStatusBadge, buttonClass } from "@/components/ui";

export default async function HuntingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getUserOrRedirect();

  // Admins see every hunt; agents see hunts assigned to them or that they added.
  const scope =
    user.role === "ADMIN"
      ? {}
      : { OR: [{ agentId: user.id }, { createdById: user.id }] };

  const [hunts, counts] = await Promise.all([
    prisma.hunt.findMany({
      where: { ...scope, ...(status ? { status } : {}) },
      include: { agent: true, createdBy: true, _count: { select: { updates: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.hunt.groupBy({ by: ["status"], where: scope, _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  const pill = (href: string, label: string, isActive: boolean) => (
    <Link
      key={href}
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap ${
        isActive
          ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
          : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Property hunting
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {total} propert{total === 1 ? "y" : "ies"} hunted — owners to pitch for a mandate
          </p>
        </div>
        <Link href="/hunting/new" className={buttonClass}>
          Add hunt
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {pill("/hunting", `All ${total}`, !status)}
        {HUNT_STATUSES.map((s) =>
          pill(`/hunting?status=${s}`, `${HUNT_STATUS_LABELS[s]} ${countFor(s)}`, status === s)
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Asking</th>
              <th className="px-4 py-3 font-medium">Assigned to</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Updates</th>
              <th className="px-4 py-3 font-medium text-right">Added</th>
            </tr>
          </thead>
          <tbody>
            {hunts.map((h) => (
              <tr
                key={h.id}
                className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/hunting/${h.id}`}
                    className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    {h.address}
                  </Link>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {h.suburb ?? ""}
                    {h.sourceUrl && (
                      <>
                        {h.suburb && " · "}
                        <a
                          href={h.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          posting ↗
                        </a>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-stone-900 dark:text-stone-100">{h.ownerName}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {h.ownerPhone ?? h.ownerEmail ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                  {h.askingPrice ? formatCompactRand(h.askingPrice) : "—"}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                  {h.agent?.name ?? "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  <HuntStatusBadge status={h.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                  {h._count.updates}
                </td>
                <td className="px-4 py-3 text-right text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  {timeAgo(h.createdAt)}
                </td>
              </tr>
            ))}
            {hunts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No hunts{status ? ` with status "${HUNT_STATUS_LABELS[status] ?? status}"` : ""} yet.
                  Spotted a private listing? Add it so an agent can chase the mandate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
