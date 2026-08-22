const ACCION_COLOR: Record<string, string> = {
  CREATE: "var(--status-good)",
  UPDATE: "var(--status-warning)",
  DELETE: "var(--status-critical)",
  LOGIN: "var(--brand-primary)",
};

export function AccionBadge({ accion }: { accion: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCION_COLOR[accion] ?? "var(--text-muted)" }} />
      {accion}
    </span>
  );
}

export function ResultadoBadge({ resultado }: { resultado: string }) {
  const color = resultado === "ERROR" ? "var(--status-critical)" : "var(--status-good)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {resultado}
    </span>
  );
}
