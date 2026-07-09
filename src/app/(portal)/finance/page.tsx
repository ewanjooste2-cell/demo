import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatRand, formatCompactRand, DEAL_STAGE_LABELS } from "@/lib/format";
import { Card, KpiTile, buttonClass } from "@/components/ui";
import { BarsChart } from "@/components/charts";
import { markPayoutPaid } from "./actions";

export default async function FinancePage() {
  const user = await getUserOrRedirect();

  const [deals, soldListings, agentCosts] = await Promise.all([
    prisma.deal.findMany({
      include: {
        listing: { select: { title: true, suburb: true, webRef: true } },
        agent: { select: { name: true } },
      },
      orderBy: { openedAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { status: "SOLD", soldDate: { not: null } },
      select: { price: true, commissionPct: true, soldDate: true },
    }),
    prisma.agentCost.findMany({ select: { amount: true, month: true } }),
  ]);

  const gross = (d: { salePrice: number; commissionPct: number }) =>
    Math.round((d.salePrice * d.commissionPct) / 100);
  const agentShare = (d: { salePrice: number; commissionPct: number; agentSplitPct: number }) =>
    Math.round((gross(d) * d.agentSplitPct) / 100);

  const registered = deals.filter((d) => d.stage === "REGISTERED");
  const inFlight = deals.filter((d) => d.stage !== "REGISTERED");
  const pipelineCommission = inFlight.reduce((s, d) => s + gross(d), 0);
  const pendingPayouts = registered
    .filter((d) => d.payoutStatus === "PENDING")
    .reduce((s, d) => s + agentShare(d), 0);

  // Banked commission by month over the last 12 months, from sold stock.
  const now = new Date();
  const monthly: { label: string; value: number }[] = [];
  let banked12m = 0;
  let support12m = 0;
  for (let m = 11; m >= 0; m--) {
    const ref = new Date(now);
    ref.setDate(1);
    ref.setHours(0, 0, 0, 0);
    ref.setMonth(ref.getMonth() - m);
    const next = new Date(ref);
    next.setMonth(next.getMonth() + 1);
    const value = soldListings
      .filter((l) => l.soldDate! >= ref && l.soldDate! < next)
      .reduce((s, l) => s + Math.round((l.price * l.commissionPct) / 100), 0);
    banked12m += value;
    support12m += agentCosts
      .filter((c) => c.month >= ref && c.month < next)
      .reduce((s, c) => s + c.amount, 0);
    monthly.push({ label: ref.toLocaleDateString("en-ZA", { month: "short" }), value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Finance</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Commission splits, payouts and brokerage margin
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Commission banked — 12 mo"
          value={formatCompactRand(banked12m)}
          sub={`net ${formatCompactRand(banked12m - support12m)} after agent support`}
        />
        <KpiTile
          label="Commission in pipeline"
          value={formatCompactRand(pipelineCommission)}
          sub={`across ${inFlight.length} open deal${inFlight.length === 1 ? "" : "s"}`}
        />
        <KpiTile
          label="Payouts due to agents"
          value={formatCompactRand(pendingPayouts)}
          sub="registered deals awaiting payout"
          subTone={pendingPayouts > 0 ? "bad" : "good"}
        />
        <KpiTile
          label="Registered this cycle"
          value={String(registered.length)}
          sub={`${deals.length} deal${deals.length === 1 ? "" : "s"} tracked in total`}
        />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Commission banked by month
        </h2>
        <BarsChart data={monthly} unit="" currency />
      </Card>

      <Card className="overflow-x-auto">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Commission ledger
          </h2>
        </div>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium text-right">Sale price</th>
              <th className="px-4 py-3 font-medium text-right">Gross comm.</th>
              <th className="px-4 py-3 font-medium text-right">Agent share</th>
              <th className="px-4 py-3 font-medium text-right">Brokerage net</th>
              <th className="px-4 py-3 font-medium">Payout</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const g = gross(d);
              const a = agentShare(d);
              return (
                <tr
                  key={d.id}
                  className="border-b border-stone-100 dark:border-stone-800 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      {d.listing.title}
                    </Link>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {d.listing.webRef}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {d.agent?.name ?? "—"}
                    <div className="text-xs text-stone-400 dark:text-stone-500">
                      {d.agentSplitPct}% split
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                    {DEAL_STAGE_LABELS[d.stage]}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100 whitespace-nowrap">
                    {formatRand(d.salePrice)}
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
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        awaiting registration
                      </span>
                    ) : d.payoutStatus === "PAID" ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                        Paid
                      </span>
                    ) : user.role === "ADMIN" ? (
                      <form action={markPayoutPaid.bind(null, d.id)}>
                        <button type="submit" className={buttonClass}>
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
                <td colSpan={8} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No deals in the ledger yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
