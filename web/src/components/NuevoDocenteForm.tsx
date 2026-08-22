"use client";

import { useActionState, useEffect, useRef } from "react";
import { registrarDocente, type RegistrarDocenteState } from "@/app/usuarios/actions";
import { SEDES } from "@/lib/validation/usuario";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialState: RegistrarDocenteState = {};

export function NuevoDocenteForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(registrarDocente, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nuevo docente">
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre" name="nombre" required />
        <FormField label="Correo" name="correo" type="email" required />
        <FormField label="Contraseña" name="password" type="password" required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sede" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Sede
          </label>
          <select
            id="sede"
            name="sede"
            required
            defaultValue={SEDES[0]}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {SEDES.map((sede) => (
              <option key={sede} value={sede}>
                {sede}
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
