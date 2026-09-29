"use client";

import { useActionState, useEffect, useState } from "react";
import { editarFase, toggleActivaFase, type CatalogoActionState } from "@/app/configuracion/actions";
import type { FaseRow } from "@/lib/queries";
import { Card } from "../Card";
import { FormField, FormTextArea } from "../FormField";

const initial: CatalogoActionState = {};

function EditarFaseForm({ fase, onDone }: { fase: FaseRow; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(editarFase, initial);
  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={fase.id} />
      <FormField label="Nombre" name="nombre" required defaultValue={fase.nombre} />
      <FormField label="Orden" name="orden" type="number" required defaultValue={String(fase.orden)} />
      <FormTextArea label="Descripción" name="descripcion" defaultValue={fase.descripcion ?? ""} />
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

function FaseRowView({ fase, editando, onEditar }: { fase: FaseRow; editando: boolean; onEditar: () => void }) {
  const [state, toggleAction, pending] = useActionState(toggleActivaFase, initial);

  return (
    <tr style={{ borderTop: "1px solid var(--gridline)" }}>
      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
        {fase.orden}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
        {fase.nombre}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {fase.descripcion}
        </p>
      </td>
      <td className="px-4 py-2.5" style={{ color: fase.activa ? "var(--status-good)" : "var(--text-muted)" }}>
        {fase.activa ? "Activa — es una pestaña" : "Inactiva"}
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
            <input type="hidden" name="id" value={fase.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: fase.activa ? "var(--status-critical)" : "var(--status-good)" }}
            >
              {pending ? "..." : fase.activa ? "Desactivar" : "Activar"}
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

export function FasesTab({ fases }: { fases: FaseRow[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = fases.find((f) => f.id === editandoId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {editando && <EditarFaseForm fase={editando} onDone={() => setEditandoId(null)} />}
      <Card
        title="Fases"
        subtitle='Pre-incubación, Incubación, Egreso — cada fase activa se muestra como pestaña en /ruta (así lo pidió la profesora en el propio Manual: "fases que deben quedar en pestañas separadas del aplicativo").'
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                <th className="px-4 py-2">Orden</th>
                <th className="px-4 py-2">Fase</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fases.map((f) => (
                <FaseRowView
                  key={f.id}
                  fase={f}
                  editando={editandoId === f.id}
                  onEditar={() => setEditandoId(editandoId === f.id ? null : f.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
