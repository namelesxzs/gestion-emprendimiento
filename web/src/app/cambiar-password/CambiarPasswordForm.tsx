"use client";

import { useActionState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cambiarPasswordPropio, type CambiarPasswordState } from "./actions";

const initialState: CambiarPasswordState = {};

export function CambiarPasswordForm() {
  const [state, formAction, isPending] = useActionState(cambiarPasswordPropio, initialState);

  useEffect(() => {
    if (state.success) {
      signOut({ callbackUrl: "/login" });
    }
  }, [state]);

  if (state.success) {
    return (
      <p className="text-sm" style={{ color: "var(--status-good)" }}>
        Contraseña actualizada. Redirigiendo a inicio de sesión...
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nuevaPassword" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Nueva contraseña
        </label>
        <input
          id="nuevaPassword"
          name="nuevaPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Confirmar contraseña
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {isPending ? "Guardando..." : "Guardar y salir"}
      </button>
    </form>
  );
}
