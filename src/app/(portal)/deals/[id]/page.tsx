import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import {
  formatRand,
  formatDate,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DOC_STATUS_LABELS,
} from "@/lib/format";
import { Card, KpiTile, buttonClass, secondaryButtonClass } from "@/components/ui";
import { advanceDealStage, progressDocument } from "../actions";

const DOC_BADGE: Record<string, string> = {
  REQUIRED: "bg-stone-100 text-stone-500 ring-stone-500/20 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-500/30",
  UPLOADED: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-400/30",
  SENT: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/30",
  SIGNED: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/60 dark:text-green-300 dark:ring-green-400/30",
};

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getUserOrRedirect();

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      listing: true,
      lead: true,
      agent: true,
      documents: { orderBy: { name: "asc" } },
      tasks: { include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!deal) notFound();

  const idx = DEAL_STAGES.indexOf(deal.stage as (typeof DEAL_STAGES)[number]);
  const grossCommission = Math.round((deal.salePrice * deal.commissionPct) / 100);
  const agentShare = Math.round((grossCommission * deal.agentSplitPct) / 100);
  const signed = deal.documents.filter((d) => d.status === "SIGNED").length;
  const advance = advanceDealStage.bind(null, deal.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400">
            <Link href="/deals" className="hover:text-stone-900 dark:hover:text-stone-100">
              Deals
            </Link>{" "}
            / {deal.listing.webRef}
          </div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mt-1">
            {deal.listing.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {deal.lead ? `Buyer: ${deal.lead.name} · ` : ""}
            {deal.agent ? `Agent: ${deal.agent.name} · ` : ""}
            opened {formatDate(deal.openedAt)}
          </p>
        </div>
        {idx < DEAL_STAGES.length - 1 && (
          <form action={advance}>
            <button type="submit" className={buttonClass}>
              Advance to {DEAL_STAGE_LABELS[DEAL_STAGES[idx + 1]]}
            </button>
          </form>
        )}
      </div>

      <Card className="p-5">
        <ol className="flex items-center gap-2">
          {DEAL_STAGES.map((s, i) => (
            <li key={s} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  i < idx ? "bg-blue-600" : i === idx ? "bg-blue-600" : "bg-stone-200 dark:bg-stone-700"
                }`}
              />
              <div
                className={`text-xs mt-1.5 ${
                  i === idx
                    ? "font-semibold text-stone-900 dark:text-stone-100"
                    : "text-stone-500 dark:text-stone-400"
                }`}
              >
                {DEAL_STAGE_LABELS[s]}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Sale price" value={formatRand(deal.salePrice)} />
        <KpiTile
          label="Gross commission"
          value={formatRand(grossCommission)}
          sub={`${deal.commissionPct}% of sale price`}
        />
        <KpiTile
          label="Agent share"
          value={formatRand(agentShare)}
          sub={`${deal.agentSplitPct}% split · ${deal.payoutStatus === "PAID" ? "paid out" : "payout pending"}`}
        />
        <KpiTile
          label="Paperwork"
          value={`${signed}/${deal.documents.length}`}
          sub="documents signed"
          subTone={signed === deal.documents.length ? "good" : "muted"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            Documents &amp; compliance
          </h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {deal.documents.map((doc) => (
              <li key={doc.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {doc.name}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset mt-1 ${DOC_BADGE[doc.status]}`}
                  >
                    {DOC_STATUS_LABELS[doc.status]}
                  </span>
                </div>
                {doc.status !== "SIGNED" && (
                  <form action={progressDocument.bind(null, doc.id)}>
                    <button type="submit" className={secondaryButtonClass}>
                      {doc.status === "SENT" ? "Mark signed" : "Send for signature"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
            Demo flow — in production this connects to an e-signature provider (DocuSign, SignRequest)
            and stores the audit trail.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            Deal tasks
          </h2>
          <ul className="space-y-3">
            {deal.tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    t.status === "DONE"
                      ? "bg-green-600"
                      : t.status === "DOING"
                        ? "bg-blue-600"
                        : "bg-stone-300 dark:bg-stone-600"
                  }`}
                />
                <div>
                  <div
                    className={
                      t.status === "DONE"
                        ? "line-through text-stone-400 dark:text-stone-500"
                        : "text-stone-900 dark:text-stone-100"
                    }
                  >
                    {t.title}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {t.assignee?.name ?? "Unassigned"}
                    {t.dueAt ? ` · due ${formatDate(t.dueAt)}` : ""}
                  </div>
                </div>
              </li>
            ))}
            {deal.tasks.length === 0 && (
              <li className="text-sm text-stone-500 dark:text-stone-400">No tasks on this deal.</li>
            )}
          </ul>
          <Link
            href="/team"
            className="inline-block text-sm text-blue-700 dark:text-blue-400 hover:underline mt-3"
          >
            Open team board →
          </Link>
        </Card>
      </div>
    </div>
  );
}
