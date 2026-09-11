"use client";

import { useState } from "react";
import type { InstrumentoRow, RespuestaInstrumentoRow } from "@/lib/queries";
import { Card } from "./Card";
import { InstrumentoForm } from "./InstrumentoForm";

/** Catálogo de instrumentos activos aplicable a un emprendedor (ver
 * auditoría §07/§08) — agrupado por fase, con el estado de diligenciamiento
 * de cada uno. Diligenciar uno abre el motor de formularios genérico
 * (InstrumentoForm), que no cambia aunque se activen o desactiven
 * instrumentos nuevos desde /configuracion. */
export function InstrumentosCatalogo({
  emprendedorId,
  instrumentos,
  respuestas,
  puedeDiligenciar,
}: {
  emprendedorId: string;
  instrumentos: InstrumentoRow[];
  respuestas: RespuestaInstrumentoRow[];
  puedeDiligenciar: boolean;
}) {
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const respuestaPorInstrumento = new Map(respuestas.map((r) => [r.instrumentoId, r]));

  const grupos = new Map<string, InstrumentoRow[]>();
  for (const inst of instrumentos) {
    const clave = inst.faseNombre ?? "Sin fase asignada";
    grupos.set(clave, [...(grupos.get(clave) ?? []), inst]);
  }

  if (instrumentos.length === 0) {
    return (
      <Card
        title="Instrumentos de la Ruta de Emprendimiento"
        subtitle="Catálogo del Manual FUMC — el Administrador no tiene ninguno activo todavía"
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No hay instrumentos activos en /configuracion.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Instrumentos de la Ruta de Emprendimiento"
      subtitle="Formatos del Manual FUMC activos en el catálogo — diligenciados o pendientes por emprendimiento"
    >
      <div className="flex flex-col gap-5">
        {[...grupos.entries()].map(([faseNombre, lista]) => (
          <div key={faseNombre}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
              {faseNombre}
            </p>
            <ul className="flex flex-col gap-2">
              {lista.map((inst) => {
                const respuesta = respuestaPorInstrumento.get(inst.id);
                const abierto = abiertoId === inst.id;
                return (
                  <li key={inst.id} className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {inst.nombre}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {inst.momento ?? "—"} · diligencia: {inst.responsableDiligencia ?? "—"}
                          {respuesta && ` · actualizado ${respuesta.updatedAt}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: respuesta ? "var(--status-good)" : "var(--status-warning)" }}
                          />
                          {respuesta ? "Diligenciado" : "Pendiente"}
                        </span>
                        {puedeDiligenciar && (
                          <button
                            type="button"
                            onClick={() => setAbiertoId(abierto ? null : inst.id)}
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--brand-primary)" }}
                          >
                            {abierto ? "Cerrar" : respuesta ? "Editar" : "Diligenciar"}
                          </button>
                        )}
                      </div>
                    </div>
                    {abierto && (
                      <InstrumentoForm
                        instrumentoId={inst.id}
                        emprendedorId={emprendedorId}
                        campos={inst.camposSchema}
                        datosPrevios={respuesta?.datos}
                        onDone={() => setAbiertoId(null)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
