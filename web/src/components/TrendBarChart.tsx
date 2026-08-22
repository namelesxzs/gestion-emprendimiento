interface TrendBarChartProps {
  data: { mes: string; count: number }[];
  color: string;
}

export function TrendBarChart({ data, color }: TrendBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-40 items-end gap-3">
      {data.map(({ mes, count }) => {
        const pct = Math.round((count / max) * 100);

        return (
          <div key={mes} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {count}
            </span>
            <div className="flex h-28 w-full items-end overflow-hidden rounded-t-md" style={{ backgroundColor: "var(--surface-2)" }}>
              <div
                className="w-full rounded-t-md transition-[height]"
                style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
              {mes}
            </span>
          </div>
        );
      })}
    </div>
  );
}
