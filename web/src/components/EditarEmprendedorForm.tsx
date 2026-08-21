"use client";

import { useActionState, useEffect } from "react";
import { editarEmprendedor, type EditarEmprendedorState } from "@/app/emprendedores/actions";
import { ETAPAS, ESTADOS_EMPRENDEDOR } from "@/lib/validation/emprendedor";
import type { Emprendedor } from "@/lib/types";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialState: EditarEmprendedorState = {};

export function EditarEmprendedorForm({
  emprendedor,
  onDone,
}: {
  emprendedor: Emprendedor;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(editarEmprendedor, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <Card title={`Editar ${emprendedor.nombre}`}>
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={emprendedor.id} />
        <FormField label="Nombre" name="nombre" required defaultValue={emprendedor.nombre} />
        <FormField
          label="Emprendimiento"
          name="emprendimiento"
          required
          defaultValue={emprendedor.emprendimiento}
        />
        <FormField label="Sector" name="sector" required defaultValue={emprendedor.sector} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etapa" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Etapa
          </label>
          <select
            id="etapa"
            name="etapa"
            required
            defaultValue={emprendedor.etapa}
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
            defaultValue={emprendedor.estado}
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
        <FormField
          label="Fecha de ingreso"
          name="fechaIngreso"
          type="date"
          required
          defaultValue={emprendedor.fechaIngreso}
        />
        <FormField label="Correo" name="correo" type="email" required defaultValue={emprendedor.correo} />
        <FormField label="Teléfono" name="telefono" required defaultValue={emprendedor.telefono} />

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
            {isPending ? "Guardando..." : "Guardar cambios"}
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
