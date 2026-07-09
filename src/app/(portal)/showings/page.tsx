import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { SHOWING_STATUS_LABELS } from "@/lib/format";
import { Card, buttonClass, secondaryButtonClass } from "@/components/ui";
import { setShowingStatus } from "./actions";

const DAY = 24 * 60 * 60 * 1000;

const STATUS_DOT: Record<string, string> = {
  REQUESTED: "bg-amber-500",
  CONFIRMED: "bg-blue-600",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-stone-300 dark:bg-stone-600",
};

function timeOf(d: Date) {
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default async function ShowingsPage() {
  await getUserOrRedirect();

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);

  const showings = await prisma.showing.findMany({
    include: {
      listing: { select: { title: true, suburb: true } },
      lead: { select: { name: true } },
      agent: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(weekStart.getTime() + i * DAY);
    const end = new Date(start.getTime() + DAY);
    return {
      date: start,
      items: showings.filter(
        (s) => s.startsAt >= start && s.startsAt < end && s.status !== "CANCELLED"
      ),
    };
  });

  const needsAction = showings.filter((s) => s.status === "REQUESTED" && s.startsAt >= weekStart);
  const recent = [...showings]
    .filter((s) => s.startsAt < weekStart)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Showings</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {days.reduce((n, d) => n + d.items.length, 0)} scheduled over the next 7 days
            {needsAction.length > 0 && ` · ${needsAction.length} awaiting confirmation`}
          </p>
        </div>
        <Link href="/showings/new" className={buttonClass}>
          Book showing
        </Link>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[860px]">
          {days.map((d, i) => (
            <div key={i} className="min-h-[10rem]">
              <div
                className={`text-xs font-medium mb-2 ${
                  i === 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-stone-500 dark:text-stone-400"
                }`}
              >
                {i === 0
                  ? "Today"
                  : d.date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div className="space-y-1.5">
                {d.items.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5"
                    title={`${s.listing.title} — ${SHOWING_STATUS_LABELS[s.status]}`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s.status]}`} />
                      {timeOf(s.startsAt)}
                      {s.kind === "OPEN_HOUSE" && (
                        <span className="text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-400">
                          Open house
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 truncate">
                      {s.listing.suburb}
                      {s.lead ? ` · ${s.lead.name.split(" ")[0]}` : ""}
                    </div>
                  </div>
                ))}
                {d.items.length === 0 && (
                  <div className="text-xs text-stone-300 dark:text-stone-600">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Awaiting confirmation
          </h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {needsAction.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {s.listing.title}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {s.startsAt.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "short" })}{" "}
                    {timeOf(s.startsAt)}
                    {s.lead ? ` · ${s.lead.name}` : ""} · {s.agent.name}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={setShowingStatus.bind(null, s.id, "CONFIRMED")}>
                    <button type="submit" className={buttonClass}>
                      Confirm
                    </button>
                  </form>
                  <form action={setShowingStatus.bind(null, s.id, "CANCELLED")}>
                    <button type="submit" className={secondaryButtonClass}>
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {needsAction.length === 0 && (
              <li className="py-3 text-sm text-stone-500 dark:text-stone-400">
                Nothing waiting — all showings are confirmed.
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Recent showings &amp; feedback
          </h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {recent.map((s) => (
              <li key={s.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {s.listing.title}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">
                    {s.startsAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} ·{" "}
                    {SHOWING_STATUS_LABELS[s.status]}
                  </span>
                </div>
                {s.feedback && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">“{s.feedback}”</p>
                )}
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-3 text-sm text-stone-500 dark:text-stone-400">No past showings.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
