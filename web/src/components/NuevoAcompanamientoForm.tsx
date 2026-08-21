"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  registrarAcompanamiento,
  type RegistrarAcompanamientoState,
} from "@/app/acompanamientos/actions";
import { ETAPAS } from "@/lib/validation/emprendedor";
import type { Emprendedor } from "@/lib/types";
import { Card } from "./Card";
import { FormField, FormTextArea } from "./FormField";

const initialState: RegistrarAcompanamientoState = {};

export function NuevoAcompanamientoForm({
  emprendedor,
  onDone,
}: {
  emprendedor: Emprendedor;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(registrarAcompanamiento, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title={`Nuevo acompañamiento — ${emprendedor.nombre}`}>
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="emprendedorId" value={emprendedor.id} />

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
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Si cambia respecto a la etapa actual ({emprendedor.etapa}), se actualiza en la ficha del
            emprendedor.
          </p>
        </div>

        <FormField label="Avance (%)" name="avancePct" type="number" required defaultValue="0" />

        <div className="sm:col-span-2">
          <FormTextArea label="Diagnóstico" name="diagnostico" required />
        </div>
        <div className="sm:col-span-2">
          <FormTextArea label="Recomendaciones" name="recomendaciones" required />
        </div>
        <div className="sm:col-span-2">
          <FormTextArea label="Compromiso" name="compromisoDescripcion" required />
        </div>
        <FormField label="Fecha del compromiso" name="compromisoFecha" type="date" required />

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
