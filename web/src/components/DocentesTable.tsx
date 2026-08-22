import type { Docente } from "@/lib/types";

export function DocentesTable({ rows }: { rows: Docente[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Todavía no hay docentes registrados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-hairline)" }}>
      <table className="w-full overflow-x-auto text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)" }}>
            {["Nombre", "Correo", "Sede", "Estado"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-xs font-bold tracking-wide uppercase"
                style={{ color: "var(--brand-ink)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--gridline)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                {r.nombre}
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                {r.correo}
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                {r.sede ?? "—"}
              </td>
              <td className="px-4 py-2.5" style={{ color: r.activo ? "var(--status-good)" : "var(--text-muted)" }}>
                {r.activo ? "Activo" : "Inactivo"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
