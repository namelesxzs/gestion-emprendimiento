"use client";

import { useActionState, useState } from "react";
import { cancelarReunion, reagendarReunion, type ReunionActionState } from "@/app/reuniones/actions";
import type { EstadoReunion } from "@/lib/types";

const ESTADO_COLOR: Record<EstadoReunion, string> = {
  Programada: "var(--status-good)",
  Reagendada: "var(--status-warning)",
  Cancelada: "var(--status-critical)",
  Realizada: "var(--text-muted)",
};

const initialState: ReunionActionState = {};

interface ReunionRowData {
  id: string;
  emprendedorNombre: string;
  fecha: string;
  hora: string;
  estado: EstadoReunion;
  observaciones: string;
}

export function ReunionRow({ reunion, puedeGestionar }: { reunion: ReunionRowData; puedeGestionar: boolean }) {
  const [showReagendar, setShowReagendar] = useState(false);
  const [reagendarState, reagendarAction, reagendarPending] = useActionState(
    reagendarReunion,
    initialState
  );
  const [, cancelarAction, cancelarPending] = useActionState(cancelarReunion, initialState);

  // Cerrar el formulario al confirmar reagendamiento: se ajusta durante el
  // render (patrón de React para "derivar estado de un cambio", no un
  // efecto) comparando contra el último estado de acción visto, en vez de
  // sincronizar con un useEffect que dispararía un re-render en cascada.
  const [ultimoEstadoVisto, setUltimoEstadoVisto] = useState(reagendarState);
  if (reagendarState !== ultimoEstadoVisto) {
    setUltimoEstadoVisto(reagendarState);
    if (reagendarState.success) setShowReagendar(false);
  }

  const activa = reunion.estado !== "Cancelada" && reunion.estado !== "Realizada";

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {reunion.emprendedorNombre}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {reunion.observaciones}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
            {reunion.fecha} · {reunion.hora}
          </p>
          <p
            className="mt-0.5 inline-flex items-center gap-1.5 justify-end text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ESTADO_COLOR[reunion.estado] }}
            />
            {reunion.estado}
          </p>
        </div>
      </div>

      {puedeGestionar && activa && (
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setShowReagendar((v) => !v)}
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--brand-primary)" }}
          >
            {showReagendar ? "Cerrar" : "Reagendar"}
          </button>
          <form action={cancelarAction}>
            <input type="hidden" name="id" value={reunion.id} />
            <button
              type="submit"
              disabled={cancelarPending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: "var(--status-critical)" }}
            >
              {cancelarPending ? "Cancelando..." : "Cancelar"}
            </button>
          </form>
        </div>
      )}

      {showReagendar && (
        <form action={reagendarAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={reunion.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Nueva fecha
            </label>
            <input
              type="date"
              name="fecha"
              required
              defaultValue={reunion.fecha}
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Nueva hora
            </label>
            <input
              type="time"
              name="hora"
              required
              defaultValue={reunion.hora}
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            disabled={reagendarPending}
            className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {reagendarPending ? "Guardando..." : "Confirmar"}
          </button>
          {reagendarState.error && (
            <p className="w-full text-xs" style={{ color: "var(--status-critical)" }}>
              {reagendarState.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
