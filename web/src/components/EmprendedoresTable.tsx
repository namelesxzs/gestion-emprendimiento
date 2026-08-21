import type { Emprendedor } from "@/lib/types";
import { EtapaBadge } from "./EtapaBadge";
import { AvanceMeter } from "./AvanceMeter";

interface Row extends Emprendedor {
  avance?: number;
}

interface EmprendedoresTableProps {
  rows: Row[];
  selectedId?: number;
  onSelect?: (row: Row) => void;
}

export function EmprendedoresTable({ rows, selectedId, onSelect }: EmprendedoresTableProps) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <table className="w-full overflow-x-auto text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)" }}>
            {["Emprendedor", "Emprendimiento", "Sector", "Etapa", "Estado", "Avance"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-xs font-bold tracking-wide uppercase"
                  style={{ color: "var(--brand-ink)" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const selected = r.id === selectedId;
            return (
              <tr
                key={r.id}
                onClick={onSelect ? () => onSelect(r) : undefined}
                className={`transition-colors ${
                  selected ? "" : "hover:[background-color:var(--surface-2)]"
                }`}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--gridline)",
                  backgroundColor: selected ? "var(--brand-primary-tint-strong)" : undefined,
                  cursor: onSelect ? "pointer" : "default",
                }}
              >
                <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                  {r.nombre}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                  {r.emprendimiento}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                  {r.sector}
                </td>
                <td className="px-4 py-2.5">
                  <EtapaBadge etapa={r.etapa} />
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                  {r.estado}
                </td>
                <td className="px-4 py-2.5">
                  {r.avance !== undefined ? (
                    <AvanceMeter pct={r.avance} />
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
