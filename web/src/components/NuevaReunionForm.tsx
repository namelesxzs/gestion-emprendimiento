"use client";

import { useActionState, useEffect, useRef } from "react";
import { programarReunion, type ReunionActionState } from "@/app/reuniones/actions";
import type { Emprendedor } from "@/lib/types";
import { Card } from "./Card";
import { FormField, FormTextArea } from "./FormField";

const initialState: ReunionActionState = {};

export function NuevaReunionForm({
  emprendedores,
  fechaSugerida,
  onDone,
}: {
  emprendedores: Emprendedor[];
  fechaSugerida: string | null;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(programarReunion, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nueva reunión">
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="emprendedorId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Emprendedor
          </label>
          <select
            id="emprendedorId"
            name="emprendedorId"
            required
            defaultValue=""
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="" disabled>
              Selecciona un emprendedor
            </option>
            {emprendedores.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} — {e.emprendimiento}
              </option>
            ))}
          </select>
        </div>

        <FormField label="Hora" name="hora" type="time" required defaultValue="09:00" />
        <FormField
          label="Fecha"
          name="fecha"
          type="date"
          required
          defaultValue={fechaSugerida ?? undefined}
        />

        <div className="sm:col-span-2">
          <FormTextArea label="Observaciones" name="observaciones" required />
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
            {isPending ? "Guardando..." : "Programar"}
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
