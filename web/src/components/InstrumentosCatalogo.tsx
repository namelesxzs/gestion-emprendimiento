"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { InstrumentoRow, RespuestaInstrumentoRow } from "@/lib/queries";
import type { Rol } from "@/types/next-auth";
import { puedeDiligenciarInstrumento, puedeRevisarInstrumento } from "@/lib/catalogo/permisos";
import { revisarRespuestaInstrumento, type RevisarRespuestaInstrumentoState } from "@/app/instrumentos/actions";
import { Card } from "./Card";
import { InstrumentoForm } from "./InstrumentoForm";

const COLOR_REVISION: Record<RespuestaInstrumentoRow["estadoRevision"], string> = {
  Pendiente: "var(--status-warning)",
  Revisado: "var(--status-good)",
  Devuelto: "var(--status-critical)",
};

const initialRevision: RevisarRespuestaInstrumentoState = {};

function RevisionForm({ respuestaId, onDone }: { respuestaId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(revisarRespuestaInstrumento, initialRevision);
  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="respuestaId" value={respuestaId} />
      <textarea
        name="comentario"
        rows={2}
        placeholder="Comentario de revisión (obligatorio para devolver)"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
      />
      {state.error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          name="decision"
          value="Revisado"
          disabled={pending}
          className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
          style={{ color: "var(--status-good)" }}
        >
          Marcar revisado
        </button>
        <button
          type="submit"
          name="decision"
          value="Devuelto"
          disabled={pending}
          className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
          style={{ color: "var(--status-critical)" }}
        >
          Devolver para corrección
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function resumenRegistro(inst: InstrumentoRow, r: RespuestaInstrumentoRow): string {
  for (const c of inst.camposSchema) {
    const v = r.datos[c.clave];
    if ((c.tipo === "fecha" || c.tipo === "texto" || c.tipo === "seleccion") && typeof v === "string" && v) {
      return `${c.etiqueta}: ${v}`;
    }
  }
  return `Registro del ${r.createdAt}`;
}

export function InstrumentosCatalogo({
  emprendedorId,
  instrumentos,
  respuestas,
  rol,
}: {
  emprendedorId: string;
  instrumentos: InstrumentoRow[];
  respuestas: RespuestaInstrumentoRow[];
  rol: Rol;
}) {
  const [formAbierto, setFormAbierto] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [revisando, setRevisando] = useState<string | null>(null);

  const respuestasPorInstrumento = new Map<string, RespuestaInstrumentoRow[]>();
  for (const r of respuestas) {
    respuestasPorInstrumento.set(r.instrumentoId, [...(respuestasPorInstrumento.get(r.instrumentoId) ?? []), r]);
  }

  const grupos = new Map<string, InstrumentoRow[]>();
  for (const inst of instrumentos) {
    const clave = inst.transversal ? "Transversal (todas las fases)" : (inst.faseNombre ?? "Sin fase asignada");
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
      subtitle="Formatos del Manual FUMC activos en el catálogo — diligenciados, pendientes y su revisión"
    >
      <div className="flex flex-col gap-5">
        {[...grupos.entries()].map(([grupo, lista]) => (
          <div key={grupo}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
              {grupo}
            </p>
            <ul className="flex flex-col gap-2">
              {lista.map((inst) => {
                const registros = respuestasPorInstrumento.get(inst.id) ?? [];
                const unico = registros[0];
                const puedeDiligenciar = puedeDiligenciarInstrumento(rol, inst.responsableDiligencia);
                const puedeRevisar = puedeRevisarInstrumento(rol, inst.responsableRevisa);
                const abiertoNuevo = formAbierto === `${inst.id}:nuevo`;
                const verRegistros = expandido === inst.id;
                const devueltos = registros.filter((r) => r.estadoRevision === "Devuelto").length;
                const vencidos = registros.filter((r) => r.revisionVencida).length;

                return (
                  <li key={inst.id} className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {inst.nombre}
                          {inst.origenManual && (
                            <span className="ml-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                              {inst.origenManual}
                            </span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {inst.momento ?? "—"} · diligencia: {inst.responsableDiligencia ?? "—"} · revisa:{" "}
                          {inst.responsableRevisa ?? "—"}
                          {inst.plazoRevisionDias && ` (plazo ${inst.plazoRevisionDias} días)`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: registros.length ? "var(--status-good)" : "var(--status-warning)" }}
                          />
                          {registros.length === 0
                            ? "Pendiente"
                            : inst.permiteMultiples
                              ? `${registros.length} registro${registros.length === 1 ? "" : "s"}`
                              : "Diligenciado"}
                        </span>
                        {devueltos > 0 && (
                          <span className="text-xs font-medium" style={{ color: "var(--status-critical)" }}>
                            {devueltos} devuelto{devueltos === 1 ? "" : "s"}
                          </span>
                        )}
                        {vencidos > 0 && (
                          <span className="text-xs font-medium" style={{ color: "var(--status-critical)" }}>
                            revisión vencida
                          </span>
                        )}
                        {registros.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandido(verRegistros ? null : inst.id)}
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {verRegistros ? "Ocultar" : "Ver registros"}
                          </button>
                        )}
                        {puedeDiligenciar && (inst.permiteMultiples || !unico) && (
                          <button
                            type="button"
                            onClick={() => setFormAbierto(abiertoNuevo ? null : `${inst.id}:nuevo`)}
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--brand-primary)" }}
                          >
                            {abiertoNuevo ? "Cerrar" : inst.permiteMultiples && unico ? "+ Nuevo registro" : "Diligenciar"}
                          </button>
                        )}
                        <Link
                          href={`/formatos/${inst.clave}`}
                          target="_blank"
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Formato en blanco
                        </Link>
                      </div>
                    </div>

                    {abiertoNuevo && (
                      <InstrumentoForm
                        instrumentoId={inst.id}
                        emprendedorId={emprendedorId}
                        campos={inst.camposSchema}
                        rol={rol}
                        onDone={() => setFormAbierto(null)}
                      />
                    )}

                    {verRegistros && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {registros.map((r) => {
                          const editando = formAbierto === `${inst.id}:${r.id}`;
                          return (
                            <li
                              key={r.id}
                              className="rounded-md border p-3"
                              style={{ borderColor: "var(--gridline)", backgroundColor: "var(--surface-2)" }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                                    {resumenRegistro(inst, r)}
                                  </p>
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Registrado por {r.registradoPorNombre} · {r.updatedAt}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-xs font-medium" style={{ color: COLOR_REVISION[r.estadoRevision] }}>
                                    {r.estadoRevision}
                                    {r.revisadoPorNombre && ` por ${r.revisadoPorNombre}`}
                                    {r.revisionVencida && " · plazo vencido"}
                                  </span>
                                  <Link
                                    href={`/formatos/${inst.clave}?respuesta=${r.id}`}
                                    target="_blank"
                                    className="text-xs font-bold uppercase tracking-wide"
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    Ver / imprimir
                                  </Link>
                                  {puedeDiligenciar && (
                                    <button
                                      type="button"
                                      onClick={() => setFormAbierto(editando ? null : `${inst.id}:${r.id}`)}
                                      className="text-xs font-bold uppercase tracking-wide"
                                      style={{ color: "var(--brand-primary)" }}
                                    >
                                      {editando ? "Cerrar" : "Editar"}
                                    </button>
                                  )}
                                  {puedeRevisar && r.estadoRevision !== "Revisado" && (
                                    <button
                                      type="button"
                                      onClick={() => setRevisando(revisando === r.id ? null : r.id)}
                                      className="text-xs font-bold uppercase tracking-wide"
                                      style={{ color: "var(--brand-primary)" }}
                                    >
                                      Revisar
                                    </button>
                                  )}
                                </div>
                              </div>
                              {r.comentarioRevision && (
                                <p className="mt-1 text-xs" style={{ color: COLOR_REVISION[r.estadoRevision] }}>
                                  Comentario de revisión: {r.comentarioRevision}
                                </p>
                              )}
                              {revisando === r.id && <RevisionForm respuestaId={r.id} onDone={() => setRevisando(null)} />}
                              {editando && (
                                <InstrumentoForm
                                  instrumentoId={inst.id}
                                  emprendedorId={emprendedorId}
                                  respuestaId={r.id}
                                  campos={inst.camposSchema}
                                  datosPrevios={r.datos}
                                  rol={rol}
                                  onDone={() => setFormAbierto(null)}
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
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
