"use client";

import { useActionState, useEffect, useState } from "react";
import { editarEtapa, toggleActivaEtapa, type CatalogoActionState } from "@/app/configuracion/actions";
import type { EtapaRow, FaseRow } from "@/lib/queries";
import { Card } from "../Card";
import { FormField } from "../FormField";

const initial: CatalogoActionState = {};

function EditarEtapaForm({ etapa, fases, onDone }: { etapa: EtapaRow; fases: FaseRow[]; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(editarEtapa, initial);
  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={etapa.id} />
      <FormField label="Nombre" name="nombre" required defaultValue={etapa.nombre} />
      <FormField label="Orden" name="orden" type="number" required defaultValue={String(etapa.orden)} />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="faseId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Fase asociada (opcional — no hay regla fija entre etapa y fase)
        </label>
        <select
          id="faseId"
          name="faseId"
          defaultValue={etapa.faseId ?? ""}
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

function EtapaRowView({ etapa, editando, onEditar }: { etapa: EtapaRow; editando: boolean; onEditar: () => void }) {
  const [state, toggleAction, pending] = useActionState(toggleActivaEtapa, initial);

  return (
    <tr style={{ borderTop: "1px solid var(--gridline)" }}>
      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
        {etapa.orden}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: etapa.color ?? "var(--text-muted)" }} />
          {etapa.nombre}
        </span>
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
        {etapa.faseNombre ?? "Sin asociar"}
      </td>
      <td className="px-4 py-2.5" style={{ color: etapa.activa ? "var(--status-good)" : "var(--text-muted)" }}>
        {etapa.activa ? "Activa" : "Inactiva"}
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
            <input type="hidden" name="id" value={etapa.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: etapa.activa ? "var(--status-critical)" : "var(--status-good)" }}
            >
              {pending ? "..." : etapa.activa ? "Desactivar" : "Activar"}
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

export function EtapasTab({ etapas, fases }: { etapas: EtapaRow[]; fases: FaseRow[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = etapas.find((e) => e.id === editandoId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {editando && <EditarEtapaForm etapa={editando} fases={fases} onDone={() => setEditandoId(null)} />}
      <Card
        title="Etapas"
        subtitle="Descubrir, Incubar, Formar, Fomentar, Financiar — la cadena de valor actual, sin modificar. Eje independiente de la fase (ver auditoría §07)."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                <th className="px-4 py-2">Orden</th>
                <th className="px-4 py-2">Etapa</th>
                <th className="px-4 py-2">Fase asociada</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {etapas.map((e) => (
                <EtapaRowView
                  key={e.id}
                  etapa={e}
                  editando={editandoId === e.id}
                  onEditar={() => setEditandoId(editandoId === e.id ? null : e.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
