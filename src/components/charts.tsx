"use client";

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

// Chart chrome tokens (validated palette — see dataviz reference).
const INK_MUTED = "#898781";
const GRID = "#e1e0d9";
const BASELINE = "#c3c2b7";
const SERIES_BLUE = "#2a78d6";
const SERIES_AQUA = "#1baf7a";

const axisProps = {
  tick: { fill: INK_MUTED, fontSize: 12 },
  axisLine: { stroke: BASELINE },
  tickLine: false as const,
};

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <div className="text-stone-500 text-xs">{label}</div>
      <div className="font-medium text-stone-900">
        {new Intl.NumberFormat("en-ZA").format(payload[0].value)} {unit}
      </div>
    </div>
  );
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
  const stroke = color === "aqua" ? SERIES_AQUA : SERIES_BLUE;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: BASELINE }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb" }}
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
}: {
  data: { label: string; value: number }[];
  unit: string;
  color?: "blue" | "aqua";
  highlightMax?: boolean;
}) {
  const fill = color === "aqua" ? SERIES_AQUA : SERIES_BLUE;
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="35%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={fill} fillOpacity={highlightMax && d.value !== max ? 0.55 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
