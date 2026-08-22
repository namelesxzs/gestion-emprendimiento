"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registrarUsuario, type RegistrarUsuarioState } from "@/app/usuarios/actions";
import { ROLES_GESTIONABLES, SEDES } from "@/lib/validation/usuario";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialState: RegistrarUsuarioState = {};

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DOCENTE: "Docente",
  COORDINADOR: "Coordinador",
};

export function NuevoUsuarioForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(registrarUsuario, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [rol, setRol] = useState<string>("DOCENTE");

  // form.reset() nativo no toca el <select> de rol porque es controlado
  // (value/onChange) — se resetea aparte, ajustado durante el render
  // comparando contra el último estado de acción visto, no en un efecto
  // (mismo patrón que ReunionRow, evita el setState directo en useEffect).
  const [ultimoEstadoVisto, setUltimoEstadoVisto] = useState(state);
  if (state !== ultimoEstadoVisto) {
    setUltimoEstadoVisto(state);
    if (state.success) setRol("DOCENTE");
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <Card title="Nuevo usuario">
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre" name="nombre" required />
        <FormField label="Correo" name="correo" type="email" required />
        <FormField label="Contraseña" name="password" type="password" required />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rol" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Rol
          </label>
          <select
            id="rol"
            name="rol"
            required
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {ROLES_GESTIONABLES.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        {rol === "DOCENTE" && (
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
        )}

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
