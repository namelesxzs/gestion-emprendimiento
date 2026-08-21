"use client";

import { useActionState, useEffect } from "react";
import { authenticate, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(authenticate, initialState);

  useEffect(() => {
    if (state.success) {
      // Navegación dura a propósito: fuerza que el layout raíz se vuelva a
      // ejecutar en servidor y lea la sesión ya autenticada, en vez de una
      // transición de cliente que reutilizaría el layout previo (sin sesión).
      window.location.href = "/";
    }
  }, [state]);

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        disabled={isPending || state.success}
        className="mt-2 rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {state.success ? "Ingresando..." : isPending ? "Verificando..." : "Ingresar"}
      </button>
    </form>
  );
}
