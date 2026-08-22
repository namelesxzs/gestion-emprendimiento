import type { CSSProperties } from "react";
import { ACCIONES_AUDITORIA, ENTIDADES_AUDITORIA, ORIGENES_AUDITORIA, RESULTADOS_AUDITORIA } from "@/lib/validation/auditoria";
import { Card } from "./Card";

const selectStyle: CSSProperties = {
  borderColor: "var(--border-hairline)",
  color: "var(--text-primary)",
};

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={selectStyle}
      >
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AuditoriaFiltros({
  usuarios,
  filtros,
}: {
  usuarios: { id: string; nombre: string }[];
  filtros: {
    entidad?: string;
    accion?: string;
    origen?: string;
    resultado?: string;
    usuarioId?: string;
    desde?: string;
    hasta?: string;
  };
}) {
  return (
    <Card title="Filtros">
      <form method="GET" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Select name="entidad" label="Entidad" value={filtros.entidad} options={ENTIDADES_AUDITORIA} />
        <Select name="accion" label="Acción" value={filtros.accion} options={ACCIONES_AUDITORIA} />
        <Select name="origen" label="Origen" value={filtros.origen} options={ORIGENES_AUDITORIA} />
        <Select name="resultado" label="Resultado" value={filtros.resultado} options={RESULTADOS_AUDITORIA} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="usuarioId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Usuario
          </label>
          <select
            id="usuarioId"
            name="usuarioId"
            defaultValue={filtros.usuarioId ?? ""}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={selectStyle}
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="desde" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={filtros.desde}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={selectStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hasta" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={filtros.hasta}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={selectStyle}
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            Filtrar
          </button>
          <a
            href="/auditoria"
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            Limpiar
          </a>
        </div>
      </form>
    </Card>
  );
}
