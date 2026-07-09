import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatRand, formatCompactRand, formatDate } from "@/lib/format";
import { Card, KpiTile } from "@/components/ui";

const DAY = 24 * 60 * 60 * 1000;

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export default async function CmaPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  await getUserOrRedirect();
  const { listing: listingParam } = await searchParams;

  const online = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "UNDER_OFFER"] } },
    orderBy: { title: "asc" },
  });
  const subject = online.find((l) => l.id === listingParam) ?? online[0];
  if (!subject) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">No live listings to analyse.</p>;
  }

  // Comparables: sold stock of the same type, similar size; same suburb ranks first.
  const sold = await prisma.listing.findMany({
    where: { status: "SOLD", soldDate: { not: null } },
    include: { agent: { select: { name: true } } },
  });
  const comps = sold
    .filter(
      (l) =>
        l.propertyType === subject.propertyType &&
        (subject.bedrooms == null || l.bedrooms == null || Math.abs(l.bedrooms - subject.bedrooms) <= 1)
    )
    .sort(
      (a, b) =>
        Number(b.suburb === subject.suburb) - Number(a.suburb === subject.suburb) ||
        b.soldDate!.getTime() - a.soldDate!.getTime()
    )
    .slice(0, 6);

  const prices = comps.map((c) => c.price);
  const med = prices.length ? median(prices) : null;
  const low = prices.length ? Math.min(...prices) : null;
  const high = prices.length ? Math.max(...prices) : null;
  const avgDom = comps.length
    ? Math.round(
        comps.reduce((s, c) => s + (c.soldDate!.getTime() - c.listedDate.getTime()) / DAY, 0) /
          comps.length
      )
    : null;
  const vsMedian = med ? ((subject.price - med) / med) * 100 : null;
  const marker =
    med && low != null && high != null && high > low
      ? Math.min(100, Math.max(0, ((subject.price - low) / (high - low)) * 100))
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Market analysis
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Comparative market analysis from your own sold stock
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="listing" className="text-sm text-stone-500 dark:text-stone-400">
            Subject property
          </label>
          <select
            id="listing"
            name="listing"
            defaultValue={subject.id}
            className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 px-3 py-1.5 text-sm"
          >
            {online.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} — {l.suburb}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 text-sm font-medium"
          >
            Analyse
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Asking price" value={formatCompactRand(subject.price)} sub={subject.suburb} />
        <KpiTile
          label="Comparable median"
          value={med ? formatCompactRand(med) : "—"}
          sub={`${comps.length} sold comparable${comps.length === 1 ? "" : "s"}`}
        />
        <KpiTile
          label="Position vs market"
          value={vsMedian != null ? `${vsMedian >= 0 ? "+" : ""}${Math.round(vsMedian)}%` : "—"}
          sub="asking vs comparable median"
          subTone={vsMedian != null && Math.abs(vsMedian) > 10 ? "bad" : "good"}
        />
        <KpiTile
          label="Expected time to sell"
          value={avgDom != null ? `${avgDom} days` : "—"}
          sub="average of comparables"
        />
      </div>

      {marker != null && low != null && high != null && (
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            Price positioning
          </h2>
          <div className="relative h-2 rounded-full bg-gradient-to-r from-green-200 via-amber-200 to-red-200 dark:from-green-900 dark:via-amber-900 dark:to-red-900">
            <div
              className="absolute -top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-stone-900 shadow"
              style={{ left: `calc(${marker}% - 8px)` }}
              title={`Asking ${formatRand(subject.price)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mt-2">
            <span>{formatCompactRand(low)} — lowest comp</span>
            <span className="font-medium text-stone-700 dark:text-stone-300">
              median {med ? formatCompactRand(med) : "—"}
            </span>
            <span>highest comp — {formatCompactRand(high)}</span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-4">
            {vsMedian != null && vsMedian > 10
              ? `Asking sits ${Math.round(vsMedian)}% above the comparable median — expect longer time on market or plan a price adjustment.`
              : vsMedian != null && vsMedian < -10
                ? `Asking sits ${Math.abs(Math.round(vsMedian))}% below the comparable median — room to negotiate up or expect a fast sale.`
                : "Asking price is well aligned with recent comparable sales."}
          </p>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Comparable sale</th>
              <th className="px-4 py-3 font-medium">Suburb</th>
              <th className="px-4 py-3 font-medium">Beds</th>
              <th className="px-4 py-3 font-medium">Sold</th>
              <th className="px-4 py-3 font-medium text-right">Days on market</th>
              <th className="px-4 py-3 font-medium text-right">Sold price</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((c) => (
              <tr
                key={c.id}
                className="border-b border-stone-100 dark:border-stone-800 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/listings/${c.id}`}
                    className="font-medium text-stone-900 dark:text-stone-100 hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    {c.title}
                  </Link>
                  {c.suburb === subject.suburb && (
                    <span className="ml-2 text-xs text-green-700 dark:text-green-400">same suburb</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{c.suburb}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{c.bedrooms ?? "—"}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                  {formatDate(c.soldDate!)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                  {Math.round((c.soldDate!.getTime() - c.listedDate.getTime()) / DAY)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-900 dark:text-stone-100 whitespace-nowrap">
                  {formatRand(c.price)}
                </td>
              </tr>
            ))}
            {comps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-500 dark:text-stone-400">
                  No sold comparables for this property type yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
