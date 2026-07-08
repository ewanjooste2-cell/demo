import { LEAD_STATUS_LABELS, LISTING_STATUS_LABELS, SOURCE_LABELS } from "@/lib/format";

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

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs text-stone-600 dark:text-stone-300">
      {SOURCE_LABELS[source] ?? source}
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

export const inputClass =
  "w-full rounded-lg border border-stone-300 dark:border-stone-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";
export const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
export const buttonClass =
  "inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex items-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800";
