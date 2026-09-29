"use client";

import { useActionState, useState } from "react";
import { atenderSolicitudRestablecimiento, type AtenderSolicitudState } from "@/app/usuarios/actions";
import type { SolicitudRestablecimientoRow } from "@/lib/queries";
import { Card } from "./Card";

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DOCENTE: "Docente",
  COORDINADOR: "Coordinador",
  EMPRENDEDOR: "Emprendedor",
};

const initialState: AtenderSolicitudState = {};

function SolicitudRow({ solicitud }: { solicitud: SolicitudRestablecimientoRow }) {
  const [state, formAction, isPending] = useActionState(atenderSolicitudRestablecimiento, initialState);
  const [cerrado, setCerrado] = useState(false);

  return (
    <li className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ color: "var(--text-primary)" }}>
            <strong>{solicitud.usuarioNombre}</strong> · {ROL_LABEL[solicitud.usuarioRol] ?? solicitud.usuarioRol}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {solicitud.correo} · pedida el {solicitud.createdAt}
          </p>
        </div>
        {!state.passwordTemporal && (
          <form action={formAction}>
            <input type="hidden" name="id" value={solicitud.id} />
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: "var(--brand-primary)" }}
            >
              {isPending ? "..." : "Atender"}
            </button>
          </form>
        )}
      </div>

      {state.error && (
        <p className="mt-1 text-xs" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      {state.passwordTemporal && !cerrado && (
        <div
          className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-md px-3 py-2 text-xs"
          style={{ backgroundColor: "var(--brand-primary-tint)", color: "var(--text-primary)" }}
        >
          <span>
            Contraseña temporal:{" "}
            <code
              className="rounded px-1 py-0.5 font-mono"
              style={{ backgroundColor: "var(--surface-1)", color: "var(--brand-ink)" }}
            >
              {state.passwordTemporal}
            </code>{" "}
            — cópiala y compártela ahora, no se vuelve a mostrar.
          </span>
          <button
            type="button"
            onClick={() => setCerrado(true)}
            className="font-bold uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Cerrar
          </button>
        </div>
      )}
    </li>
  );
}

export function SolicitudesRestablecimiento({
  solicitudes,
}: {
  solicitudes: SolicitudRestablecimientoRow[];
}) {
  if (solicitudes.length === 0) return null;

  return (
    <Card
      title="Solicitudes de restablecimiento"
      subtitle={`${solicitudes.length} pedido${solicitudes.length === 1 ? "" : "s"} de "olvidé mi contraseña" sin atender`}
    >
      <ul className="flex flex-col gap-3">
        {solicitudes.map((s) => (
          <SolicitudRow key={s.id} solicitud={s} />
        ))}
      </ul>
    </Card>
  );
}
