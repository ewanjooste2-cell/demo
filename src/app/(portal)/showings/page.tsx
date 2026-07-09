import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { SHOWING_STATUS_LABELS } from "@/lib/format";
import { Card, buttonClass } from "@/components/ui";
import { setShowingStatus } from "./actions";

const DAY = 24 * 60 * 60 * 1000;
const FIRST_HOUR = 7;
const LAST_HOUR = 19; // exclusive end of the visible grid
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);

const BLOCK_STYLE: Record<string, string> = {
  REQUESTED:
    "border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200",
  CONFIRMED: "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200",
  COMPLETED:
    "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-200",
};

function timeOf(d: Date) {
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function dayKey(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

export default async function ShowingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; agent?: string }>;
}) {
  const { week, agent: agentParam } = await searchParams;
  const user = await getUserOrRedirect();
  const weekOffset = Math.max(-52, Math.min(52, parseInt(week ?? "0", 10) || 0));

  // Monday of the selected week.
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) + weekOffset * 7);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
  const today = dayKey(new Date());

  const [agents, showings, me, notifications] = await Promise.all([
    prisma.user.findMany({
      where: { role: "AGENT", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.showing.findMany({
      where: {
        startsAt: { gte: weekStart, lt: weekEnd },
        status: { not: "CANCELLED" },
        ...(agentParam ? { agentId: agentParam } : {}),
      },
      include: {
        listing: { select: { title: true, suburb: true } },
        lead: { select: { name: true } },
        agent: { select: { name: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { calendarToken: true },
    }),
    prisma.notification.findMany({
      where: user.role === "ADMIN" ? {} : { userId: user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const awaiting = await prisma.showing.findMany({
    where: {
      status: "REQUESTED",
      startsAt: { gte: new Date() },
      ...(user.role === "ADMIN" ? {} : { agentId: user.id }),
    },
    include: {
      listing: { select: { title: true, suburb: true } },
      lead: { select: { name: true } },
      agent: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * DAY);
    return { date, items: showings.filter((s) => dayKey(s.startsAt) === date.getTime()) };
  });

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const icsUrl = me?.calendarToken ? `${proto}://${host}/api/calendar/${me.calendarToken}.ics` : null;

  const weekHref = (offset: number) =>
    `/showings?week=${offset}${agentParam ? `&agent=${agentParam}` : ""}`;
  const agentHref = (id?: string) =>
    `/showings?week=${weekOffset}${id ? `&agent=${id}` : ""}`;
  const pill = (selected: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap ${
      selected
        ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
        : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
    }`;

  const gridHeight = (LAST_HOUR - FIRST_HOUR) * 3; // rem

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Showings</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} –{" "}
            {new Date(weekEnd.getTime() - DAY).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {awaiting.length > 0 && ` · ${awaiting.length} awaiting confirmation`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={weekHref(weekOffset - 1)} className={pill(false)} aria-label="Previous week">
            ‹
          </Link>
          <Link href={weekHref(0)} className={pill(weekOffset === 0)}>
            This week
          </Link>
          <Link href={weekHref(weekOffset + 1)} className={pill(false)} aria-label="Next week">
            ›
          </Link>
          <Link href="/showings/new" className={buttonClass}>
            Book showing
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <Link href={agentHref()} className={pill(!agentParam)}>
          All agents
        </Link>
        {agents.map((a) => (
          <Link key={a.id} href={agentHref(a.id)} className={pill(agentParam === a.id)}>
            {a.name.split(" ")[0]}
          </Link>
        ))}
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-x-2">
            <div />
            {days.map((d, i) => (
              <div key={i} className="flex items-center justify-between pb-2">
                <span
                  className={`text-xs font-medium ${
                    d.date.getTime() === today
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {d.date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })}
                </span>
                <Link
                  href={`/showings/new?date=${d.date.toISOString().slice(0, 10)}`}
                  aria-label={`Book showing on ${d.date.toDateString()}`}
                  className="text-stone-300 dark:text-stone-600 hover:text-blue-600 dark:hover:text-blue-400 text-sm leading-none"
                >
                  +
                </Link>
              </div>
            ))}

            <div className="relative" style={{ height: `${gridHeight}rem` }}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-1 text-[10px] text-stone-400 dark:text-stone-500 tabular-nums -translate-y-1/2"
                  style={{ top: `${(i / HOURS.length) * 100}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {days.map((d, di) => (
              <div
                key={di}
                className={`relative rounded-lg ${
                  d.date.getTime() === today
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : "bg-stone-50/60 dark:bg-stone-800/30"
                }`}
                style={{ height: `${gridHeight}rem` }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    aria-hidden="true"
                    className="absolute inset-x-0 border-t border-stone-100 dark:border-stone-800"
                    style={{ top: `${(i / HOURS.length) * 100}%` }}
                  />
                ))}
                {d.items.map((s) => {
                  const startH = s.startsAt.getHours() + s.startsAt.getMinutes() / 60;
                  const endH = Math.min(
                    LAST_HOUR,
                    s.endsAt.getHours() + s.endsAt.getMinutes() / 60
                  );
                  const top = Math.max(0, ((startH - FIRST_HOUR) / (LAST_HOUR - FIRST_HOUR)) * 100);
                  const height = Math.max(
                    5,
                    ((endH - Math.max(FIRST_HOUR, startH)) / (LAST_HOUR - FIRST_HOUR)) * 100
                  );
                  return (
                    <div
                      key={s.id}
                      className={`absolute inset-x-0.5 rounded-md border-l-2 px-1.5 py-1 overflow-hidden text-[11px] leading-tight ${
                        BLOCK_STYLE[s.status] ?? BLOCK_STYLE.CONFIRMED
                      }`}
                      style={{ top: `${top}%`, height: `${height}%` }}
                      title={`${s.listing.title} — ${SHOWING_STATUS_LABELS[s.status]}${s.lead ? ` · ${s.lead.name}` : ""} · ${s.agent.name}`}
                    >
                      <div className="font-semibold tabular-nums">
                        {timeOf(s.startsAt)}
                        {s.kind === "OPEN_HOUSE" && " · Open house"}
                      </div>
                      <div className="truncate">{s.listing.suburb}</div>
                      {!agentParam && <div className="truncate opacity-70">{s.agent.name.split(" ")[0]}</div>}
                      {s.status === "REQUESTED" && (
                        <div className="flex gap-1 mt-0.5">
                          <form action={setShowingStatus.bind(null, s.id, "CONFIRMED")}>
                            <button type="submit" className="font-semibold hover:underline">
                              Confirm
                            </button>
                          </form>
                          <form action={setShowingStatus.bind(null, s.id, "CANCELLED")}>
                            <button type="submit" className="opacity-70 hover:underline">
                              Decline
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Awaiting confirmation
          </h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {awaiting.map((s) => (
              <li key={s.id} className="py-3">
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {s.listing.title}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {s.startsAt.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}{" "}
                  {timeOf(s.startsAt)}
                  {s.lead ? ` · ${s.lead.name}` : ""} · {s.agent.name}
                </div>
                <div className="flex gap-3 mt-1.5">
                  <form action={setShowingStatus.bind(null, s.id, "CONFIRMED")}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      Confirm
                    </button>
                  </form>
                  <form action={setShowingStatus.bind(null, s.id, "CANCELLED")}>
                    <button
                      type="submit"
                      className="text-xs text-stone-500 dark:text-stone-400 hover:underline"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {awaiting.length === 0 && (
              <li className="py-3 text-sm text-stone-500 dark:text-stone-400">
                Nothing waiting — the diary is confirmed.
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Link your calendar
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Subscribe from Google Calendar, Outlook or Apple Calendar and your confirmed showings
            appear in your own diary automatically.
          </p>
          {icsUrl ? (
            <code className="block mt-3 text-xs bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2 break-all select-all">
              {icsUrl}
            </code>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">
              No calendar token on your profile yet — ask your principal to re-create your user.
            </p>
          )}
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Google Calendar: Other calendars → + → From URL. Keep this link private.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Email notifications
          </h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {notifications.map((n) => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-stone-900 dark:text-stone-100">
                    {n.user.name} · {n.to}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide font-medium shrink-0 ${
                      n.status === "SENT"
                        ? "text-green-700 dark:text-green-400"
                        : n.status === "FAILED"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {n.status === "SIMULATED" ? "demo" : n.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{n.body}</p>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="py-3 text-sm text-stone-500 dark:text-stone-400">No messages yet.</li>
            )}
          </ul>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Agents are emailed when someone books a showing on their listing. Mails send via
            Resend (free tier) once an API key is configured; in the demo they are recorded here.
          </p>
        </Card>
      </div>
    </div>
  );
}
