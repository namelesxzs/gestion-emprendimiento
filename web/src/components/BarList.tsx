interface BarListProps {
  data: { label: string; count: number; sublabel?: string }[];
  color: string;
  emptyText?: string;
}

export function BarList({ data, color, emptyText = "Sin datos todavía." }: BarListProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {emptyText}
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-3">
      {data.map(({ label, count, sublabel }) => {
        const pct = Math.round((count / max) * 100);

        return (
          <div key={label} className="grid grid-cols-[112px_1fr_28px] items-center gap-3">
            <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }} title={label}>
              {label}
              {sublabel && (
                <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {sublabel}
                </span>
              )}
            </span>

            <div className="h-5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
              <div
                className="h-5 rounded-full transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
