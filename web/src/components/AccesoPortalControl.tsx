"use client";

import { useActionState, useState } from "react";
import { useSession } from "next-auth/react";
import { otorgarAccesoPortal, type OtorgarAccesoPortalState } from "@/app/usuarios/actions";

const initialState: OtorgarAccesoPortalState = {};

export function AccesoPortalControl({ emprendedorId, yaTieneAcceso }: { emprendedorId: string; yaTieneAcceso: boolean }) {
  const [state, formAction, isPending] = useActionState(otorgarAccesoPortal, initialState);
  const [cerrado, setCerrado] = useState(false);
  const { data: session } = useSession();

  // Solo Administrador da de alta cuentas — mismo límite que /usuarios. El
  // control real está en el servidor (requireRole dentro de la action);
  // esto solo evita mostrar un botón que va a devolver 403.
  if (session?.user.rol !== "ADMINISTRADOR") return null;

  if (yaTieneAcceso && !state.passwordTemporal) {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Ya tiene acceso al portal
      </span>
    );
  }

  if (state.passwordTemporal && !cerrado) {
    return (
      <div
        className="flex flex-wrap items-center gap-3 rounded-md px-3 py-2 text-xs"
        style={{ backgroundColor: "var(--brand-primary-tint)", color: "var(--text-primary)" }}
      >
        <span>
          Contraseña temporal:{" "}
          <code className="rounded px-1 py-0.5 font-mono" style={{ backgroundColor: "var(--surface-1)", color: "var(--brand-ink)" }}>
            {state.passwordTemporal}
          </code>{" "}
          — cópiala ahora, no se vuelve a mostrar.
        </span>
        <button type="button" onClick={() => setCerrado(true)} className="font-bold uppercase" style={{ color: "var(--text-secondary)" }}>
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="emprendedorId" value={emprendedorId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
        style={{ color: "var(--brand-primary)" }}
      >
        {isPending ? "..." : "Dar acceso al portal"}
      </button>
      {state.error && (
        <span className="text-xs" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
