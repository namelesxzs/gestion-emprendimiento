"use client";

import { useActionState } from "react";
import { solicitarRestablecimiento, type SolicitarRestablecimientoState } from "./actions";

const initialState: SolicitarRestablecimientoState = {};

export function RecuperarAccesoForm() {
  const [state, formAction, isPending] = useActionState(solicitarRestablecimiento, initialState);

  if (state.success) {
    return (
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
        Si el correo existe en la plataforma, un Administrador atenderá tu solicitud pronto y te
        hará llegar una contraseña temporal.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="correo" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
        />
      </div>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {isPending ? "Enviando..." : "Solicitar restablecimiento"}
      </button>
    </form>
  );
}
