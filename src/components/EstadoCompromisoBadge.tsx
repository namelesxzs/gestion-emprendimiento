import type { EstadoCompromiso } from "@/lib/types";

const ESTADO_COLOR: Record<EstadoCompromiso, string> = {
  Pendiente: "var(--status-warning)",
  "En proceso": "var(--sequential-450)",
  Cumplido: "var(--status-good)",
};

export function EstadoCompromisoBadge({ estado }: { estado: EstadoCompromiso }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      style={{ color: "var(--text-secondary)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: ESTADO_COLOR[estado] }}
      />
      {estado}
    </span>
  );
}
