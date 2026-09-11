"use client";

import { useActionState, useEffect, useRef } from "react";
import { registrarEmprendedor, type RegistrarEmprendedorState } from "@/app/emprendedores/actions";
import { ETAPAS, ESTADOS_EMPRENDEDOR } from "@/lib/validation/emprendedor";
import type { FaseRow } from "@/lib/queries";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialState: RegistrarEmprendedorState = {};

export function NuevoEmprendedorForm({ onDone, fases }: { onDone: () => void; fases: FaseRow[] }) {
  const [state, formAction, isPending] = useActionState(registrarEmprendedor, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nuevo emprendedor">
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre" name="nombre" required />
        <FormField label="Emprendimiento" name="emprendimiento" required />
        <FormField label="Sector" name="sector" required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etapa" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Etapa
          </label>
          <select
            id="etapa"
            name="etapa"
            required
            defaultValue="Descubrir"
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {ETAPAS.map((etapa) => (
              <option key={etapa} value={etapa}>
                {etapa}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="estado" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            required
            defaultValue="Activo"
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {ESTADOS_EMPRENDEDOR.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>
        <FormField label="Fecha de ingreso" name="fechaIngreso" type="date" required />
        <FormField label="Correo" name="correo" type="email" required />
        <FormField label="Teléfono" name="telefono" required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="faseId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Fase (opcional — eje independiente de la etapa)
          </label>
          <select
            id="faseId"
            name="faseId"
            defaultValue=""
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="">Sin asignar</option>
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
            {isPending ? "Guardando..." : "Registrar"}
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
