import Link from "next/link";
import {
  HUNT_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  SOURCE_LABELS,
} from "@/lib/format";

const LEAD_BADGE: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/30",
  CONTACTED: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-400/30",
  VIEWING: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-400/30",
  OFFER: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-400/30",
  WON: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/60 dark:text-green-300 dark:ring-green-400/30",
  LOST: "bg-stone-100 text-stone-500 ring-stone-500/20 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-500/30",
};

const LISTING_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/60 dark:text-green-300 dark:ring-green-400/30",
  UNDER_OFFER: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-400/30",
  SOLD: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/30",
  WITHDRAWN: "bg-stone-100 text-stone-500 ring-stone-500/20 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-500/30",
  EXPIRED: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-400/30",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        LEAD_BADGE[status] ?? LEAD_BADGE.LOST
      }`}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ListingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        LISTING_BADGE[status] ?? LISTING_BADGE.WITHDRAWN
      }`}
    >
      {LISTING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const HUNT_BADGE: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/30",
  ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-400/30",
  CONTACTED: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-400/30",
  APPOINTMENT: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-400/30",
  MANDATE_SIGNED: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/60 dark:text-green-300 dark:ring-green-400/30",
  DECLINED: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-400/30",
  DROPPED: "bg-stone-100 text-stone-500 ring-stone-500/20 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-500/30",
};

export function HuntStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        HUNT_BADGE[status] ?? HUNT_BADGE.DROPPED
      }`}
    >
      {HUNT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-300">
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-teal-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-emerald-600",
];

/** Initials avatar — color is stable per name so people stay recognisable. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const dims = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${color} ${dims}`}
    >
      {initials}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  subTone = "muted",
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "muted" | "good" | "bad";
}) {
  const tone =
    subTone === "good"
      ? "text-green-700 dark:text-green-400"
      : subTone === "bad"
        ? "text-red-600 dark:text-red-400"
        : "text-stone-500 dark:text-stone-400";
  return (
    <Card className="p-5">
      <div className="text-sm text-stone-500 dark:text-stone-400">{label}</div>
      <div className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mt-1">{value}</div>
      {sub && <div className={`text-xs mt-1 ${tone}`}>{sub}</div>}
    </Card>
  );
}

/** Tiny server-rendered trend line for stat tiles; null months break the line. */
function Sparkline({ points }: { points: (number | null)[] }) {
  const values = points.filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 96;
  const h = 28;
  const x = (i: number) => (i / (points.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 3 - ((v - min) / range) * (h - 6);
  // Split into segments at nulls so gaps stay gaps.
  const segments: string[] = [];
  let current: string[] = [];
  points.forEach((v, i) => {
    if (v == null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    } else {
      current.push(`${x(i)},${y(v)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(" "));
  const lastIndex = points.length - 1 - [...points].reverse().findIndex((v) => v != null);
  const last = points[lastIndex];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="text-stone-300 dark:text-stone-600 shrink-0"
    >
      {segments.map((s, i) => (
        <polyline
          key={i}
          points={s}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {last != null && (
        <circle cx={x(lastIndex)} cy={y(last)} r="2.5" className="fill-blue-600 dark:fill-blue-400" />
      )}
    </svg>
  );
}

/**
 * Executive stat tile: big value, change vs the prior period, one supporting
 * line and an optional sparkline. `href` makes the whole tile a drill-down.
 */
export function StatTile({
  label,
  value,
  sub,
  delta,
  spark,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Percent change vs the prior period; `goodWhenDown` for costs and DOM. */
  delta?: { pct: number; goodWhenDown?: boolean } | null;
  spark?: (number | null)[];
  href?: string;
}) {
  const chip = (() => {
    if (delta == null || !Number.isFinite(delta.pct)) return null;
    const up = delta.pct >= 0;
    const good = delta.goodWhenDown ? !up : up;
    const magnitude = Math.abs(Math.round(delta.pct));
    // A near-zero prior period produces absurd percentages — noise, not signal.
    if (magnitude === 0 || magnitude > 300) return null;
    return (
      <span
        title="vs the previous period"
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
          good
            ? "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
        }`}
      >
        {up ? "↑" : "↓"} {magnitude}%
      </span>
    );
  })();

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {label}
        </div>
        {href && (
          <span
            aria-hidden="true"
            className="text-stone-300 dark:text-stone-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            →
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
        <div className="text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-stone-100">
          {value}
        </div>
        {chip}
      </div>
      <div className="flex items-end justify-between gap-2 mt-2 min-h-[28px]">
        {sub ? (
          <div className="text-xs text-stone-500 dark:text-stone-400">{sub}</div>
        ) : (
          <span />
        )}
        {spark && <Sparkline points={spark} />}
      </div>
    </>
  );

  const frame =
    "block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-5";
  if (href) {
    return (
      <Link
        href={href}
        className={`${frame} group hover:border-stone-300 dark:hover:border-stone-600 hover:shadow transition`}
      >
        {body}
      </Link>
    );
  }
  return <div className={frame}>{body}</div>;
}

export const inputClass =
  "w-full rounded-lg border border-stone-300 dark:border-stone-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";
export const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
export const buttonClass =
  "inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex items-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800";
