"use client";

import { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

// Chart chrome tokens per theme (validated palette — see dataviz reference).
const TOKENS = {
  light: {
    inkMuted: "#898781",
    grid: "#e1e0d9",
    baseline: "#c3c2b7",
    blue: "#2a78d6",
    aqua: "#1baf7a",
    dotStroke: "#fcfcfb",
    cursorFill: "rgba(11,11,11,0.04)",
  },
  dark: {
    inkMuted: "#8f8d86",
    grid: "#2b2927",
    baseline: "#44413e",
    blue: "#5b9ee8",
    aqua: "#34c08d",
    dotStroke: "#1c1917",
    cursorFill: "rgba(255,255,255,0.06)",
  },
};

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function useChartTokens() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
  return TOKENS[isDark ? "dark" : "light"];
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  unit: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const value = currency
    ? new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        maximumFractionDigits: 0,
      }).format(payload[0].value)
    : `${new Intl.NumberFormat("en-ZA").format(payload[0].value)} ${unit}`;
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-md px-3 py-2 text-sm">
      <div className="text-stone-500 dark:text-stone-400 text-xs">{label}</div>
      <div className="font-medium text-stone-900 dark:text-stone-100">{value}</div>
    </div>
  );
}

/** R2 850 000 → "R2.85m" for compact axis labels. */
function compactRand(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `R${m >= 10 ? Math.round(m) : Math.round(m * 100) / 100}m`;
  }
  if (Math.abs(value) >= 1_000) return `R${Math.round(value / 1_000)}k`;
  return `R${value}`;
}

export function TrendChart({
  data,
  unit,
  color = "blue",
}: {
  data: { label: string; value: number }[];
  unit: string;
  color?: "blue" | "aqua";
}) {
  const t = useChartTokens();
  const axisProps = {
    tick: { fill: t.inkMuted, fontSize: 12 },
    axisLine: { stroke: t.baseline },
    tickLine: false as const,
  };
  const stroke = color === "aqua" ? t.aqua : t.blue;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={t.grid} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: t.baseline }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: t.dotStroke }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  unit,
  color = "blue",
  highlightMax = false,
  currency = false,
}: {
  data: { label: string; value: number }[];
  unit: string;
  color?: "blue" | "aqua";
  highlightMax?: boolean;
  currency?: boolean;
}) {
  const t = useChartTokens();
  const axisProps = {
    tick: { fill: t.inkMuted, fontSize: 12 },
    axisLine: { stroke: t.baseline },
    tickLine: false as const,
  };
  const fill = color === "aqua" ? t.aqua : t.blue;
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="35%">
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis
          {...axisProps}
          width={currency ? 56 : 44}
          allowDecimals={false}
          tickFormatter={currency ? compactRand : undefined}
        />
        <Tooltip
          content={<ChartTooltip unit={unit} currency={currency} />}
          cursor={{ fill: t.cursorFill }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={fill} fillOpacity={highlightMax && d.value !== max ? 0.55 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
