import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatRand, DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/format";
import { Card } from "@/components/ui";

export default async function DealsPage() {
  await getUserOrRedirect();

  const deals = await prisma.deal.findMany({
    include: {
      listing: { select: { title: true, suburb: true, webRef: true } },
      lead: { select: { name: true } },
      agent: { select: { name: true } },
      documents: { select: { status: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  const stageIdx = (s: string) => DEAL_STAGES.indexOf(s as (typeof DEAL_STAGES)[number]);
  const inFlight = deals.filter((d) => d.stage !== "REGISTERED");
  const pipelineValue = inFlight.reduce((sum, d) => sum + d.salePrice, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Deals</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {inFlight.length} in progress · {formatRand(pipelineValue)} in the pipeline
        </p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {DEAL_STAGES.map((s) => {
          const count = deals.filter((d) => d.stage === s).length;
          return (
            <div
              key={s}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2"
            >
              <div className="text-xs text-stone-500 dark:text-stone-400">{DEAL_STAGE_LABELS[s]}</div>
              <div className="text-lg font-semibold text-stone-900 dark:text-stone-100">{count}</div>
            </div>
          );
        })}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Sale price</th>
              <th className="px-4 py-3 font-medium">Paperwork</th>
              <th className="px-4 py-3 font-medium w-56">Progress</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const idx = stageIdx(d.stage);
              const signed = d.documents.filter((doc) => doc.status === "SIGNED").length;
              return (
                <tr
                  key={d.id}
                  className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      {d.listing.title}
                    </Link>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {d.listing.suburb} · {d.listing.webRef}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{d.lead?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{d.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-900 dark:text-stone-100">
                    {formatRand(d.salePrice)}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                    {signed}/{d.documents.length} signed
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" title={DEAL_STAGE_LABELS[d.stage]}>
                      {DEAL_STAGES.map((s, i) => (
                        <span
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= idx ? "bg-blue-600" : "bg-stone-200 dark:bg-stone-700"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {DEAL_STAGE_LABELS[d.stage]}
                    </div>
                  </td>
                </tr>
              );
            })}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No deals yet — accept an offer on a listing to open a deal room.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
