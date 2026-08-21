interface ReunionRow {
  id: string;
  emprendedorNombre: string;
  fecha: string;
  hora: string;
  estado: string;
  observaciones: string;
}

const ESTADO_COLOR: Record<string, string> = {
  Programada: "var(--status-good)",
  Reagendada: "var(--status-warning)",
};

export function ProximasReuniones({ reuniones }: { reuniones: ReunionRow[] }) {
  if (reuniones.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No hay reuniones programadas.
      </p>
    );
  }

  return (
    <ul className="flex max-h-72 flex-col gap-2.5 overflow-y-auto pr-1">
      {reuniones.map((r) => (
        <li
          key={r.id}
          className="flex items-start justify-between rounded-lg border px-3 py-2.5"
          style={{
            borderColor: "var(--border-hairline)",
            backgroundColor: "var(--surface-1)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {r.emprendedorNombre}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {r.observaciones}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {r.fecha} · {r.hora}
            </p>
            <p
              className="mt-0.5 inline-flex items-center gap-1.5 justify-end text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ESTADO_COLOR[r.estado] ?? "var(--text-muted)" }}
              />
              {r.estado}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
