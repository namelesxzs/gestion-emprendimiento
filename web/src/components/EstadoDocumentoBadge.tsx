import type { EstadoDocumento } from "@/lib/types";

const ESTADO_COLOR: Record<EstadoDocumento, string> = {
  Pendiente: "var(--status-warning)",
  Aprobado: "var(--status-good)",
  Rechazado: "var(--status-critical)",
};

export function EstadoDocumentoBadge({ estado }: { estado: EstadoDocumento }) {
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
