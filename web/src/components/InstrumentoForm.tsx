"use client";

// Motor de formularios genérico (ver auditoría §07/§08, C3): dibuja el
// formulario de un Instrumento del catálogo a partir de su `camposSchema`
// — activar un instrumento nuevo desde /configuracion no exige programar
// una pantalla propia, esta es la única que hace falta.

import { useActionState, useEffect } from "react";
import { guardarRespuestaInstrumento, type GuardarRespuestaInstrumentoState } from "@/app/instrumentos/actions";
import type { CampoRuntime } from "@/lib/validation/catalogo";

const initialState: GuardarRespuestaInstrumentoState = {};

function Campo({ campo, valor }: { campo: CampoRuntime; valor: unknown }) {
  const label = (
    <label htmlFor={campo.clave} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
      {campo.etiqueta}
      {campo.requerido && " *"}
    </label>
  );
  const baseStyle = { borderColor: "var(--border-hairline)", color: "var(--text-primary)" } as const;

  if (campo.tipo === "textarea") {
    return (
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        {label}
        <textarea
          id={campo.clave}
          name={campo.clave}
          required={campo.requerido}
          defaultValue={typeof valor === "string" ? valor : ""}
          rows={3}
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={baseStyle}
        />
      </div>
    );
  }

  if (campo.tipo === "seleccion") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <select
          id={campo.clave}
          name={campo.clave}
          required={campo.requerido}
          defaultValue={typeof valor === "string" ? valor : ""}
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={baseStyle}
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          {(campo.opciones ?? []).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (campo.tipo === "booleano") {
    return (
      <div className="flex items-center gap-2 pt-5">
        <input
          id={campo.clave}
          name={campo.clave}
          type="checkbox"
          defaultChecked={valor === true}
          className="h-4 w-4"
        />
        <label htmlFor={campo.clave} className="text-sm" style={{ color: "var(--text-primary)" }}>
          {campo.etiqueta}
          {campo.requerido && " *"}
        </label>
      </div>
    );
  }

  const htmlType = campo.tipo === "numero" ? "number" : campo.tipo === "fecha" ? "date" : "text";
  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <input
        id={campo.clave}
        name={campo.clave}
        type={htmlType}
        required={campo.requerido}
        defaultValue={typeof valor === "string" || typeof valor === "number" ? valor : ""}
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={baseStyle}
      />
    </div>
  );
}

export function InstrumentoForm({
  instrumentoId,
  emprendedorId,
  campos,
  datosPrevios,
  onDone,
}: {
  instrumentoId: string;
  emprendedorId: string;
  campos: CampoRuntime[];
  datosPrevios?: Record<string, unknown>;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(guardarRespuestaInstrumento, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <input type="hidden" name="instrumentoId" value={instrumentoId} />
      <input type="hidden" name="emprendedorId" value={emprendedorId} />

      {campos.map((campo) => (
        <Campo key={campo.clave} campo={campo} valor={datosPrevios?.[campo.clave]} />
      ))}

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
          {isPending ? "Guardando..." : "Guardar"}
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
  );
}
