"use client";

import { useState } from "react";
import type { FaseRow, InstrumentoRow } from "@/lib/queries";
import { Card } from "./Card";

/** Comentario de la profesora dentro del Manual, anclado a "Fase 1 —
 * Pre-incubación": "Fases que deben quedar en pestañas separadas del
 * aplicativo". Esta es esa pantalla — cada fase activa del catálogo
 * configurable es una pestaña, con el catálogo de instrumentos que le
 * corresponde (ver auditoría §07/§08). */
export function RutaExplorer({ fases, instrumentos }: { fases: FaseRow[]; instrumentos: InstrumentoRow[] }) {
  const [faseId, setFaseId] = useState<string | null>(fases[0]?.id ?? null);
  const faseActiva = fases.find((f) => f.id === faseId) ?? null;
  const instrumentosFase = instrumentos.filter((i) => i.faseId === faseId);

  if (fases.length === 0) {
    return (
      <Card title="Ruta de Emprendimiento">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          El Administrador no tiene ninguna fase activa todavía — ver <code>/configuracion</code>.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border-hairline)" }}>
        {fases.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFaseId(f.id)}
            className="border-b-2 px-4 py-2.5 text-sm font-bold tracking-wide uppercase transition-colors"
            style={{
              borderColor: faseId === f.id ? "var(--brand-primary)" : "transparent",
              color: faseId === f.id ? "var(--brand-primary)" : "var(--text-secondary)",
            }}
          >
            {f.nombre}
          </button>
        ))}
      </div>

      {faseActiva && (
        <Card title={faseActiva.nombre} subtitle={faseActiva.descripcion ?? undefined}>
          {instrumentosFase.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Esta fase no tiene instrumentos activos todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {instrumentosFase.map((i) => (
                <li key={i.id} className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {i.nombre}
                  </p>
                  <p className="mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {i.proposito}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {i.momento ?? "—"} · diligencia: {i.responsableDiligencia ?? "—"} · revisa:{" "}
                    {i.responsableRevisa ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
