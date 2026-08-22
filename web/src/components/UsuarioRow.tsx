"use client";

import { useActionState, useState } from "react";
import {
  restablecerPasswordUsuario,
  toggleActivoUsuario,
  type RestablecerPasswordState,
  type ToggleActivoState,
} from "@/app/usuarios/actions";
import type { UsuarioGestionable } from "@/lib/types";

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DOCENTE: "Docente",
  COORDINADOR: "Coordinador",
};

const initialToggle: ToggleActivoState = {};
const initialReset: RestablecerPasswordState = {};

export function UsuarioRow({
  usuario,
  primera,
  esUnoMismo,
  onEditar,
}: {
  usuario: UsuarioGestionable;
  primera: boolean;
  esUnoMismo: boolean;
  onEditar: () => void;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleActivoUsuario, initialToggle);
  const [resetState, resetAction, resetPending] = useActionState(restablecerPasswordUsuario, initialReset);
  const [passwordCerrada, setPasswordCerrada] = useState(false);

  const mostrarPassword = resetState.passwordTemporal && !passwordCerrada;

  return (
    <>
      <tr style={{ borderTop: primera ? "none" : "1px solid var(--gridline)" }}>
        <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
          {usuario.nombre}
        </td>
        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
          {usuario.correo}
        </td>
        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
          {ROL_LABEL[usuario.rol]}
        </td>
        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
          {usuario.sede ?? "—"}
        </td>
        <td className="px-4 py-2.5" style={{ color: usuario.activo ? "var(--status-good)" : "var(--text-muted)" }}>
          {usuario.activo ? "Activo" : "Inactivo"}
        </td>
        <td className="px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEditar}
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--brand-primary)" }}
            >
              Editar
            </button>

            <form action={toggleAction}>
              <input type="hidden" name="id" value={usuario.id} />
              <button
                type="submit"
                disabled={togglePending || esUnoMismo}
                title={esUnoMismo ? "No puedes desactivar tu propia cuenta" : undefined}
                className="text-xs font-bold uppercase tracking-wide disabled:opacity-40"
                style={{ color: usuario.activo ? "var(--status-critical)" : "var(--status-good)" }}
              >
                {togglePending ? "..." : usuario.activo ? "Desactivar" : "Activar"}
              </button>
            </form>

            <form action={resetAction} onSubmit={() => setPasswordCerrada(false)}>
              <input type="hidden" name="id" value={usuario.id} />
              <button
                type="submit"
                disabled={resetPending}
                className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
                style={{ color: "var(--text-secondary)" }}
              >
                {resetPending ? "..." : "Restablecer contraseña"}
              </button>
            </form>
          </div>
          {(toggleState.error || resetState.error) && (
            <p className="mt-1 text-xs" style={{ color: "var(--status-critical)" }}>
              {toggleState.error || resetState.error}
            </p>
          )}
        </td>
      </tr>

      {mostrarPassword && (
        <tr>
          <td colSpan={6} className="px-4 py-3" style={{ backgroundColor: "var(--brand-primary-tint)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p style={{ color: "var(--text-primary)" }}>
                Contraseña temporal para <strong>{usuario.nombre}</strong>:{" "}
                <code
                  className="rounded px-1.5 py-0.5 font-mono"
                  style={{ backgroundColor: "var(--surface-1)", color: "var(--brand-ink)" }}
                >
                  {resetState.passwordTemporal}
                </code>
                {" — cópiala y compártela ahora, no se puede volver a mostrar."}
              </p>
              <button
                type="button"
                onClick={() => setPasswordCerrada(true)}
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                Cerrar
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
