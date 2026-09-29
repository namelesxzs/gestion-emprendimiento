"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { editarInstrumento, toggleActivoInstrumento, type CatalogoActionState } from "@/app/configuracion/actions";
import type { FaseRow, InstrumentoRow } from "@/lib/queries";
import { Card } from "../Card";
import { FormField, FormTextArea } from "../FormField";
import { FilterChip } from "../FilterChip";

const initial: CatalogoActionState = {};

function EditarInstrumentoForm({
  instrumento,
  fases,
  onDone,
}: {
  instrumento: InstrumentoRow;
  fases: FaseRow[];
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(editarInstrumento, initial);
  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={instrumento.id} />
      <FormField label="Nombre" name="nombre" required defaultValue={instrumento.nombre} />
      <FormField label="Momento de aplicación" name="momento" defaultValue={instrumento.momento ?? ""} />
      <FormTextArea label="Propósito" name="proposito" required defaultValue={instrumento.proposito} />
      <FormField
        label="Responsable de diligenciar"
        name="responsableDiligencia"
        defaultValue={instrumento.responsableDiligencia ?? ""}
      />
      <FormField label="Responsable de revisar" name="responsableRevisa" defaultValue={instrumento.responsableRevisa ?? ""} />
      <FormField label="Orden" name="orden" type="number" required defaultValue={String(instrumento.orden)} />
      <FormField
        label="Plazo de revisión (días) — Manual §5.6"
        name="plazoRevisionDias"
        type="number"
        defaultValue={instrumento.plazoRevisionDias ? String(instrumento.plazoRevisionDias) : ""}
      />
      <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
        <input type="checkbox" name="permiteMultiples" defaultChecked={instrumento.permiteMultiples} className="h-4 w-4" />
        Se diligencia varias veces por emprendimiento (cada sesión, cada versión, cada periodo)
      </label>
      <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
        <input type="checkbox" name="transversal" defaultChecked={instrumento.transversal} className="h-4 w-4" />
        Transversal: aplica en todas las fases
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="faseId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Fase
        </label>
        <select
          id="faseId"
          name="faseId"
          defaultValue={instrumento.faseId ?? ""}
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
        >
          <option value="">Sin asociar</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs sm:col-span-2" style={{ color: "var(--text-muted)" }}>
        {instrumento.camposSchema.length} campo{instrumento.camposSchema.length === 1 ? "" : "s"} sembrados desde el
        Manual (origen {instrumento.origenManual ?? "—"}) — la estructura de campos no se edita desde aquí todavía.
      </p>
      {state.error && (
        <p className="sm:col-span-2 text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function InstrumentoRowView({
  instrumento,
  editando,
  onEditar,
}: {
  instrumento: InstrumentoRow;
  editando: boolean;
  onEditar: () => void;
}) {
  const [state, toggleAction, pending] = useActionState(toggleActivoInstrumento, initial);

  return (
    <tr style={{ borderTop: "1px solid var(--gridline)" }}>
      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
        {instrumento.origenManual ?? "—"}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
        {instrumento.nombre}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {instrumento.proposito}
        </p>
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
        {instrumento.faseNombre ?? "—"}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
        {instrumento.momento ?? "—"}
      </td>
      <td className="px-4 py-2.5" style={{ color: instrumento.activo ? "var(--status-good)" : "var(--text-muted)" }}>
        {instrumento.activo ? "Activo" : "Inactivo"}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEditar}
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--brand-primary)" }}
          >
            {editando ? "Cerrar" : "Editar"}
          </button>
          <form action={toggleAction}>
            <input type="hidden" name="id" value={instrumento.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: instrumento.activo ? "var(--status-critical)" : "var(--status-good)" }}
            >
              {pending ? "..." : instrumento.activo ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
        {state.error && (
          <p className="mt-1 text-xs" style={{ color: "var(--status-critical)" }}>
            {state.error}
          </p>
        )}
      </td>
    </tr>
  );
}

export function InstrumentosTab({ instrumentos, fases }: { instrumentos: InstrumentoRow[]; fases: FaseRow[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [faseFiltro, setFaseFiltro] = useState<string | null>(null);

  const filtrados = useMemo(
    () => (faseFiltro ? instrumentos.filter((i) => i.faseId === faseFiltro) : instrumentos),
    [instrumentos, faseFiltro]
  );
  const editando = instrumentos.find((i) => i.id === editandoId) ?? null;
  const activos = instrumentos.filter((i) => i.activo).length;

  return (
    <div className="flex flex-col gap-4">
      {editando && <EditarInstrumentoForm instrumento={editando} fases={fases} onDone={() => setEditandoId(null)} />}
      <Card
        title="Instrumentos"
        subtitle={`${instrumentos.length} formatos del Manual sembrados — ${activos} activos. Desactivar uno lo saca de /ruta y de los formularios de captura, sin borrar lo ya diligenciado.`}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterChip label="Todas las fases" active={faseFiltro === null} onClick={() => setFaseFiltro(null)} />
          {fases.map((f) => (
            <FilterChip key={f.id} label={f.nombre} active={faseFiltro === f.id} onClick={() => setFaseFiltro(f.id)} />
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                <th className="px-4 py-2">Manual</th>
                <th className="px-4 py-2">Instrumento</th>
                <th className="px-4 py-2">Fase</th>
                <th className="px-4 py-2">Momento</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((i) => (
                <InstrumentoRowView
                  key={i.id}
                  instrumento={i}
                  editando={editandoId === i.id}
                  onEditar={() => setEditandoId(editandoId === i.id ? null : i.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
