"use client";

interface TrendLineChartProps {
  points: number[];
  labels: string[];
  stroke?: string;
  fill?: string;
}

interface ValueBar {
  label: string;
  value: number;
}

interface HorizontalBarsProps {
  title: string;
  items: ValueBar[];
  formatter?: (value: number) => string;
}

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  items: DonutItem[];
  size?: number;
}

export function TrendLineChart({
  points,
  labels,
  stroke = "#ef4444",
  fill = "rgba(239, 68, 68, 0.18)"
}: TrendLineChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        No trend data yet.
      </div>
    );
  }

  const width = 640;
  const height = 200;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;

  const mapped = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point - min) / spread) * (height - 16) - 8;
    return { x, y, value: point };
  });

  const linePath = mapped.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
        <path d={areaPath} fill={fill} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {mapped.map((point) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="3.5" fill={stroke} />
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:grid-cols-6">
        {labels.slice(-6).map((label) => (
          <span key={label} className="truncate">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBars({ title, items, formatter }: HorizontalBarsProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const width = `${Math.max((item.value / maxValue) * 100, 4)}%`;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span className="truncate pr-4">{item.label}</span>
                <span className="font-semibold text-red-200">{formatter ? formatter(item.value) : item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonutChart({ items, size = 140 }: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const center = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = radius * 0.6;

  let currentAngle = -90;
  const segments = items.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const ix1 = center + innerRadius * Math.cos(startRad);
    const iy1 = center + innerRadius * Math.sin(startRad);
    const ix2 = center + innerRadius * Math.cos(endRad);
    const iy2 = center + innerRadius * Math.sin(endRad);

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      "Z"
    ].join(" ");

    return { ...item, d, pct: ((item.value / total) * 100).toFixed(0) };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {segments.map((seg) => (
          <path key={seg.label} d={seg.d} fill={seg.color} opacity="0.85" className="transition-opacity hover:opacity-100" />
        ))}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="central" className="fill-white text-lg font-bold">
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" dominantBaseline="central" className="fill-slate-400 text-[9px] uppercase tracking-wider">
          Total
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="capitalize text-slate-300">{seg.label}</span>
            <span className="font-semibold text-slate-200">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
