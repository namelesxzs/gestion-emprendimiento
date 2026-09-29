"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  crearReglaAvance,
  toggleActivaReglaAvance,
  type CatalogoActionState,
  type CrearReglaAvanceState,
} from "@/app/configuracion/actions";
import type { FaseRow, InstrumentoRow, ReglaAvanceRow } from "@/lib/queries";
import { Card } from "../Card";
import { FormField } from "../FormField";

const initialToggle: CatalogoActionState = {};
const initialCrear: CrearReglaAvanceState = {};

function NuevaReglaAvanceForm({
  fases,
  instrumentos,
  onDone,
}: {
  fases: FaseRow[];
  instrumentos: InstrumentoRow[];
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(crearReglaAvance, initialCrear);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nueva regla de avance" subtitle='Generaliza el "formato de tránsito de fase" del Manual (6.13) — sin reglas, el paso entre fases queda libre.'>
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre de la regla (ej. Gate pre-incubación → incubación)" name="nombre" required />
        <div />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="faseOrigenId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Fase origen (vacío = aplica desde cualquiera)
          </label>
          <select
            id="faseOrigenId"
            name="faseOrigenId"
            defaultValue=""
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="">Cualquiera</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="faseDestinoId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Fase destino
          </label>
          <select
            id="faseDestinoId"
            name="faseDestinoId"
            required
            defaultValue=""
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="" disabled>
              Selecciona una fase
            </option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Instrumentos requeridos para habilitar el paso
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {instrumentos.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <input type="checkbox" name="instrumentosClaves" value={i.clave} />
                {i.nombre}
              </label>
            ))}
          </div>
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
            {isPending ? "Guardando..." : "Crear regla"}
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

function ReglaAvanceRowView({ regla }: { regla: ReglaAvanceRow }) {
  const [state, toggleAction, pending] = useActionState(toggleActivaReglaAvance, initialToggle);

  return (
    <tr style={{ borderTop: "1px solid var(--gridline)" }}>
      <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
        {regla.nombre}
      </td>
      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
        {regla.faseOrigenNombre ?? "Cualquiera"} → {regla.faseDestinoNombre}
      </td>
      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
        {regla.instrumentosClaves.length} instrumento{regla.instrumentosClaves.length === 1 ? "" : "s"} requerido
        {regla.instrumentosClaves.length === 1 ? "" : "s"}
      </td>
      <td className="px-4 py-2.5" style={{ color: regla.activa ? "var(--status-good)" : "var(--text-muted)" }}>
        {regla.activa ? "Activa" : "Inactiva"}
      </td>
      <td className="px-4 py-2.5">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={regla.id} />
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
            style={{ color: regla.activa ? "var(--status-critical)" : "var(--status-good)" }}
          >
            {pending ? "..." : regla.activa ? "Desactivar" : "Activar"}
          </button>
        </form>
        {state.error && (
          <p className="mt-1 text-xs" style={{ color: "var(--status-critical)" }}>
            {state.error}
          </p>
        )}
      </td>
    </tr>
  );
}

export function ReglasAvanceTab({
  reglas,
  fases,
  instrumentos,
}: {
  reglas: ReglaAvanceRow[];
  fases: FaseRow[];
  instrumentos: InstrumentoRow[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {showForm ? "Cerrar formulario" : "+ Nueva regla"}
        </button>
      </div>

      {showForm && <NuevaReglaAvanceForm fases={fases} instrumentos={instrumentos} onDone={() => setShowForm(false)} />}

      <Card
        title="Reglas de avance"
        subtitle="Sin reglas activas para una transición, el paso entre fases queda libre — el gate solo existe cuando lo configuras aquí."
      >
        {reglas.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Todavía no hay reglas de avance configuradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  <th className="px-4 py-2">Regla</th>
                  <th className="px-4 py-2">Transición</th>
                  <th className="px-4 py-2">Instrumentos</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reglas.map((r) => (
                  <ReglaAvanceRowView key={r.id} regla={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
