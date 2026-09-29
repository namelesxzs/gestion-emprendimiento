import { Card } from "./Card";

export function ExportarFormatos({
  cohortes,
  sedes,
  asesores,
}: {
  cohortes: { id: string; nombre: string }[];
  sedes: readonly string[];
  asesores: { id: string; nombre: string }[];
}) {
  const selectClass = "rounded-md border px-3 py-2 text-sm outline-none";
  const selectStyle = { borderColor: "var(--border-hairline)", color: "var(--text-primary)" } as const;
  return (
    <Card
      title="Exportar formatos diligenciados"
      subtitle="Una hoja de Excel por formato, con cohorte, sede y asesor de cada emprendimiento (Manual §5.5)"
    >
      <form action="/api/exportar/instrumentos" method="get" className="flex flex-wrap items-end gap-3">
        <select name="cohorteId" defaultValue="" className={selectClass} style={selectStyle} aria-label="Cohorte">
          <option value="">Todas las cohortes</option>
          {cohortes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select name="sede" defaultValue="" className={selectClass} style={selectStyle} aria-label="Sede">
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="asesorId" defaultValue="" className={selectClass} style={selectStyle} aria-label="Asesor">
          <option value="">Todos los asesores</option>
          {asesores.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Descargar Excel
        </button>
      </form>
    </Card>
  );
}
