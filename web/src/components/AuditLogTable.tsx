import type { AuditLogRow } from "@/lib/queries";
import { AccionBadge, ResultadoBadge } from "./AuditoriaBadges";

function DetalleCambio({ anterior, nuevo }: { anterior: Record<string, unknown> | null; nuevo: Record<string, unknown> | null }) {
  if (!anterior && !nuevo) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Sin datos adicionales registrados.
      </p>
    );
  }

  const claves = Array.from(new Set([...Object.keys(anterior ?? {}), ...Object.keys(nuevo ?? {})]));

  return (
    <div className="flex flex-col gap-1">
      {claves.map((clave) => {
        const av = anterior?.[clave];
        const nv = nuevo?.[clave];
        const huboCambio = anterior && nuevo && JSON.stringify(av) !== JSON.stringify(nv);

        return (
          <div key={clave} className="flex gap-2 text-xs">
            <span className="w-32 shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>
              {clave}
            </span>
            {anterior && nuevo ? (
              huboCambio ? (
                <span style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--status-critical)" }}>{String(av)}</span>
                  {" → "}
                  <span style={{ color: "var(--status-good)" }}>{String(nv)}</span>
                </span>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>{String(nv)}</span>
              )
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>{String(nv ?? av)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AuditLogTable({ rows }: { rows: AuditLogRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No hay registros de auditoría que coincidan con los filtros.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-hairline)" }}>
      <table className="w-full overflow-x-auto text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)" }}>
            {["Fecha", "Usuario", "Entidad", "Acción", "Origen", "Resultado", ""].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-bold tracking-wide uppercase" style={{ color: "var(--brand-ink)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--gridline)" }}>
              <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                {r.createdAt}
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                {r.usuarioNombre ?? "—"}
                {r.rolSnapshot && (
                  <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    ({r.rolSnapshot})
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                {r.entidad}
              </td>
              <td className="px-4 py-2.5">
                <AccionBadge accion={r.accion} />
              </td>
              <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                {r.origen}
              </td>
              <td className="px-4 py-2.5">
                <ResultadoBadge resultado={r.resultado} />
              </td>
              <td className="px-4 py-2.5">
                <details>
                  <summary
                    className="cursor-pointer text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    Ver
                  </summary>
                  <div className="mt-2 w-72">
                    <DetalleCambio anterior={r.valorAnterior} nuevo={r.valorNuevo} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
