"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  crearCohorte,
  editarCohorte,
  toggleActivaCohorte,
  type CatalogoActionState,
  type CrearCohorteState,
} from "@/app/configuracion/actions";
import { SEDES } from "@/lib/validation/usuario";
import type { Cohorte } from "@/lib/types";
import { Card } from "../Card";
import { FormField } from "../FormField";

const initialToggle: CatalogoActionState = {};
const initialCrear: CrearCohorteState = {};

function CampoSede({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="sede" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Sede (opcional)
      </label>
      <select
        id="sede"
        name="sede"
        defaultValue={defaultValue ?? ""}
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
      >
        <option value="">Sin especificar</option>
        {SEDES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

function NuevaCohorteForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(crearCohorte, initialCrear);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nueva cohorte">
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre (ej. Cohorte 2026-2)" name="nombre" required />
        <CampoSede />
        <FormField label="Fecha de inicio" name="fechaInicio" type="date" />
        <FormField label="Fecha de fin (estimada)" name="fechaFin" type="date" />
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
            {isPending ? "Guardando..." : "Crear cohorte"}
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
    </Card>
  );
}

function EditarCohorteForm({ cohorte, onDone }: { cohorte: Cohorte; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(editarCohorte, initialToggle);
  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={cohorte.id} />
      <FormField label="Nombre" name="nombre" required defaultValue={cohorte.nombre} />
      <CampoSede defaultValue={cohorte.sede} />
      <FormField label="Fecha de inicio" name="fechaInicio" type="date" defaultValue={cohorte.fechaInicio ?? ""} />
      <FormField label="Fecha de fin (estimada)" name="fechaFin" type="date" defaultValue={cohorte.fechaFin ?? ""} />
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

function CohorteRowView({ cohorte, editando, onEditar }: { cohorte: Cohorte; editando: boolean; onEditar: () => void }) {
  const [state, toggleAction, pending] = useActionState(toggleActivaCohorte, initialToggle);

  return (
    <tr style={{ borderTop: "1px solid var(--gridline)" }}>
      <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
        {cohorte.nombre}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
        {cohorte.sede ?? "—"}
      </td>
      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
        {cohorte.fechaInicio ?? "—"} → {cohorte.fechaFin ?? "—"}
      </td>
      <td className="px-4 py-2.5" style={{ color: cohorte.activa ? "var(--status-good)" : "var(--text-muted)" }}>
        {cohorte.activa ? "Activa" : "Inactiva"}
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
            <input type="hidden" name="id" value={cohorte.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: cohorte.activa ? "var(--status-critical)" : "var(--status-good)" }}
            >
              {pending ? "..." : cohorte.activa ? "Desactivar" : "Activar"}
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

export function CohortesTab({ cohortes }: { cohortes: Cohorte[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = cohortes.find((c) => c.id === editandoId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {showForm ? "Cerrar formulario" : "+ Nueva cohorte"}
        </button>
      </div>

      {showForm && <NuevaCohorteForm onDone={() => setShowForm(false)} />}
      {editando && <EditarCohorteForm cohorte={editando} onDone={() => setEditandoId(null)} />}

      <Card
        title="Cohortes"
        subtitle="Unidad de reporte que pide el Manual (§5.2/5.5) para Vicerrectoría y convocatorias externas — cada emprendedor puede pertenecer a una."
      >
        {cohortes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Todavía no hay cohortes creadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  <th className="px-4 py-2">Cohorte</th>
                  <th className="px-4 py-2">Sede</th>
                  <th className="px-4 py-2">Vigencia</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cohortes.map((c) => (
                  <CohorteRowView
                    key={c.id}
                    cohorte={c}
                    editando={editandoId === c.id}
                    onEditar={() => setEditandoId(editandoId === c.id ? null : c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
