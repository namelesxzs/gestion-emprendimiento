"use client";

import { useActionState, useRef, useState } from "react";
import { analizarArchivo, confirmarImportacion, type AnalizarState, type ConfirmarState } from "@/app/importar/actions";
import { Card } from "./Card";

const initialAnalizar: AnalizarState = {};
const initialConfirmar: ConfirmarState = {};

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "var(--status-good)" },
  actualizado: { label: "Actualización", color: "var(--status-warning)" },
  sin_cambios: { label: "Sin cambios", color: "var(--text-muted)" },
  error: { label: "Error", color: "var(--status-critical)" },
  duplicado_en_archivo: { label: "Duplicado en archivo", color: "var(--status-critical)" },
};

export function ImportarExcel() {
  const [analizarState, analizarAction, analizando] = useActionState(analizarArchivo, initialAnalizar);
  const [confirmarState, confirmarAction, confirmando] = useActionState(confirmarImportacion, initialConfirmar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resultado = analizarState.resultado;
  const yaConfirmado = confirmarState.success;

  function reiniciar() {
    window.location.reload();
  }

  if (yaConfirmado && confirmarState.resumen) {
    return (
      <Card title="Importación completada">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            La importación se aplicó correctamente y quedó registrada en el historial de auditoría.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Nuevos" value={confirmarState.resumen.nuevos} color="var(--status-good)" />
            <Stat label="Actualizados" value={confirmarState.resumen.actualizados} color="var(--status-warning)" />
            <Stat label="Sin cambios" value={confirmarState.resumen.sinCambios} color="var(--text-muted)" />
            <Stat label="Errores" value={confirmarState.resumen.errores} color="var(--status-critical)" />
          </div>
          <div>
            <button
              type="button"
              onClick={reiniciar}
              className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              Nueva importación
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="1. Subir archivo" subtitle="Solo se admite la hoja «Emprendedores» de la plantilla oficial (.xlsx)">
        <form action={analizarAction} className="flex flex-wrap items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            name="archivo"
            accept=".xlsx"
            required
            className="text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            disabled={analizando}
            className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {analizando ? "Analizando..." : "Analizar archivo"}
          </button>
        </form>
        {analizarState.error && (
          <p className="mt-3 text-sm" style={{ color: "var(--status-critical)" }}>
            {analizarState.error}
          </p>
        )}
      </Card>

      {resultado && (
        <>
          <Card title="2. Previsualización" subtitle="Nada se modifica en la base de datos todavía">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Nuevos" value={resultado.nuevos} color="var(--status-good)" />
              <Stat label="Actualizados" value={resultado.actualizados} color="var(--status-warning)" />
              <Stat label="Sin cambios" value={resultado.sinCambios} color="var(--text-muted)" />
              <Stat label="Errores" value={resultado.errores} color="var(--status-critical)" />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {resultado.filas.map((f) => (
                <FilaPreview key={f.fila} fila={f} />
              ))}
              {resultado.filas.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  El archivo no tiene filas de datos para procesar.
                </p>
              )}
            </div>
          </Card>

          <Card title="3. Confirmar">
            <form action={confirmarAction} className="flex flex-col gap-3">
              <input type="hidden" name="archivoBase64" value={analizarState.archivoBase64} />
              <input type="hidden" name="nombreArchivo" value={analizarState.nombreArchivo} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Al confirmar se aplican {resultado.nuevos} altas y {resultado.actualizados} actualizaciones dentro
                de una sola transacción. Las {resultado.sinCambios} filas sin cambios y las {resultado.errores} con
                error no se tocan. El historial de acompañamientos, reuniones y compromisos nunca se modifica desde
                aquí.
              </p>
              <div>
                <button
                  type="submit"
                  disabled={confirmando || resultado.nuevos + resultado.actualizados === 0}
                  className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  {confirmando ? "Aplicando..." : "Confirmar importación"}
                </button>
              </div>
              {confirmarState.error && (
                <p className="text-sm" style={{ color: "var(--status-critical)" }}>
                  {confirmarState.error}
                </p>
              )}
            </form>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--surface-2)" }}>
      <p className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: "var(--font-brand)" }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
    </div>
  );
}

function FilaPreview({
  fila,
}: {
  fila: {
    fila: number;
    estado: string;
    correo?: string;
    nombre?: string;
    cambios?: { campo: string; anterior: string; nuevo: string }[];
    errores?: { columna: string; valor: string; mensaje: string }[];
  };
}) {
  const [expandido, setExpandido] = useState(false);
  const info = ESTADO_LABEL[fila.estado] ?? { label: fila.estado, color: "var(--text-muted)" };
  const tieneDetalle = (fila.cambios && fila.cambios.length > 0) || (fila.errores && fila.errores.length > 0);

  return (
    <div className="rounded-md border p-2.5" style={{ borderColor: "var(--border-hairline)" }}>
      <button
        type="button"
        onClick={() => tieneDetalle && setExpandido((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        style={{ cursor: tieneDetalle ? "pointer" : "default" }}
      >
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          Fila {fila.fila} — {fila.nombre ?? fila.correo ?? "(sin identificar)"}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: info.color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
          {info.label}
        </span>
      </button>

      {expandido && fila.cambios && fila.cambios.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {fila.cambios.map((c) => (
            <p key={c.campo}>
              <strong style={{ color: "var(--text-primary)" }}>{c.campo}</strong>: {c.anterior || "—"} →{" "}
              {c.nuevo || "—"}
            </p>
          ))}
        </div>
      )}

      {expandido && fila.errores && fila.errores.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: "var(--status-critical)" }}>
          {fila.errores.map((e, i) => (
            <p key={i}>
              Columna <strong>{e.columna}</strong> (valor: &quot;{e.valor}&quot;): {e.mensaje}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
