"use client";

import { useActionState, useEffect, useState } from "react";
import { editarUsuario, type EditarUsuarioState } from "@/app/usuarios/actions";
import { ROLES_GESTIONABLES, SEDES } from "@/lib/validation/usuario";
import type { UsuarioGestionable } from "@/lib/types";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialState: EditarUsuarioState = {};

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DOCENTE: "Docente",
  COORDINADOR: "Coordinador",
};

export function EditarUsuarioForm({ usuario, onDone }: { usuario: UsuarioGestionable; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(editarUsuario, initialState);
  const [rol, setRol] = useState<string>(usuario.rol);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <Card title={`Editar ${usuario.nombre}`}>
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={usuario.id} />
        <FormField label="Nombre" name="nombre" required defaultValue={usuario.nombre} />
        <FormField label="Correo" name="correo" type="email" required defaultValue={usuario.correo} />

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
              defaultValue={usuario.sede && (SEDES as readonly string[]).includes(usuario.sede) ? usuario.sede : SEDES[0]}
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
