interface StatTileProps {
  label: string;
  value: string | number;
  accent: string;
}

export function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--surface-1)",
        borderColor: "var(--border-hairline)",
        borderTopWidth: "3px",
        borderTopColor: accent,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p
        className="text-3xl font-bold tabular-nums"
        style={{ color: accent, fontFamily: "var(--font-brand)" }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-xs font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>
    </div>
  );
}
