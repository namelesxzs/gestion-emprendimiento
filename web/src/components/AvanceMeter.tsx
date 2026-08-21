export function AvanceMeter({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--sequential-150)" }}
      >
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "var(--sequential-450)" }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {pct}%
      </span>
    </div>
  );
}
