export function formatRand(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

/** R2 850 000 → "R2.85m", R980 000 → "R980k" — for chart axes and dense tiles. */
export function formatCompactRand(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `R${m >= 10 ? Math.round(m) : Math.round(m * 100) / 100}m`;
  }
  if (Math.abs(value) >= 1_000) return `R${Math.round(value / 1_000)}k`;
  return `R${value}`;
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) return "just now";
    return `${hours}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export const LEAD_STATUSES = ["NEW", "CONTACTED", "VIEWING", "OFFER", "WON", "LOST"] as const;
export const LISTING_STATUSES = ["ACTIVE", "UNDER_OFFER", "SOLD", "WITHDRAWN", "EXPIRED"] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  VIEWING: "Viewing booked",
  OFFER: "Offer made",
  WON: "Won",
  LOST: "Lost",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  UNDER_OFFER: "Under offer",
  SOLD: "Sold",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

export const SOURCE_LABELS: Record<string, string> = {
  EMAIL: "Portal email",
  WEBHOOK: "Webhook",
  IMPORT: "Report import",
  MANUAL: "Manual",
};

export const DEAL_STAGES = [
  "OFFER",
  "OTP_SIGNED",
  "BOND",
  "INSPECTIONS",
  "TRANSFER",
  "REGISTERED",
] as const;

export const DEAL_STAGE_LABELS: Record<string, string> = {
  OFFER: "Offer",
  OTP_SIGNED: "OTP signed",
  BOND: "Bond approval",
  INSPECTIONS: "Inspections",
  TRANSFER: "Transfer",
  REGISTERED: "Registered",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  REQUIRED: "Required",
  UPLOADED: "Uploaded",
  SENT: "Sent for signature",
  SIGNED: "Signed",
};

export const SHOWING_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
