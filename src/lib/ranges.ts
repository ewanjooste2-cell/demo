// Shared between the server-side range resolver and the client picker —
// must stay a plain module (no "use client") so both can read the values.
export type RangePreset = { key: string; label: string };

export const RANGE_PRESETS: RangePreset[] = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "mtd", label: "Month to date" },
  { key: "ytd", label: "Year to date" },
  { key: "365", label: "Last 12 months" },
  { key: "all", label: "All time" },
];
