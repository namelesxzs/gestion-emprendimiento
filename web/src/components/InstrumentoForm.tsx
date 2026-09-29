"use client";

import { useActionState, useEffect, useState } from "react";
import { guardarRespuestaInstrumento, type GuardarRespuestaInstrumentoState } from "@/app/instrumentos/actions";
import { nombreCelda, puedeFirmar, type CampoRuntime } from "@/lib/validation/catalogo";
import type { FirmaValor } from "@/lib/catalogo/tipos";
import type { Rol } from "@/types/next-auth";

const initialState: GuardarRespuestaInstrumentoState = {};
const baseStyle = { borderColor: "var(--border-hairline)", color: "var(--text-primary)" } as const;
const inputClass = "w-full rounded-md border px-3 py-2 text-sm outline-none";

function Ayuda({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
      {texto}
    </p>
  );
}

function Control({
  campo,
  name,
  valor,
  requerido,
  onNumero,
}: {
  campo: CampoRuntime;
  name: string;
  valor: unknown;
  requerido?: boolean;
  onNumero?: (n: number) => void;
}) {
  const str = typeof valor === "string" || typeof valor === "number" ? String(valor) : "";
  if (campo.tipo === "textarea") {
    return <textarea id={name} name={name} required={requerido} defaultValue={str} rows={3} className={inputClass} style={baseStyle} />;
  }
  if (campo.tipo === "seleccion") {
    return (
      <select id={name} name={name} required={requerido} defaultValue={str} className={inputClass} style={baseStyle}>
        <option value="">Selecciona…</option>
        {(campo.opciones ?? []).map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    );
  }
  const htmlType = campo.tipo === "numero" ? "number" : campo.tipo === "fecha" ? "date" : "text";
  return (
    <input
      id={name}
      name={name}
      type={htmlType}
      required={requerido}
      min={campo.min}
      max={campo.max}
      step={campo.tipo === "numero" ? "any" : undefined}
      defaultValue={str}
      onChange={onNumero ? (e) => onNumero(Number(e.target.value) || 0) : undefined}
      className={inputClass}
      style={baseStyle}
    />
  );
}

function CampoTabla({
  campo,
  valor,
  onColumnaNumerica,
}: {
  campo: CampoRuntime;
  valor: unknown;
  onColumnaNumerica: (tabla: string, fila: string, columna: string, n: number) => void;
}) {
  const columnas = campo.columnas ?? [];
  const previas = Array.isArray(valor) ? (valor as Record<string, unknown>[]) : [];
  const fijas = campo.filas ?? [];
  const [filasLibres, setFilasLibres] = useState<number[]>(() =>
    Array.from({ length: Math.max(previas.length, campo.filasIniciales ?? 1) }, (_, i) => i)
  );

  const filas = fijas.length
    ? fijas.map((f) => ({ id: f.clave, etiqueta: f.etiqueta, descripcion: f.descripcion, previa: previas.find((p) => p.fila === f.clave) }))
    : filasLibres.map((i) => ({ id: String(i), etiqueta: null, descripcion: undefined, previa: previas[i] }));

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {campo.etiqueta}
        {campo.requerido && " *"}
      </p>
      <Ayuda texto={campo.ayuda} />
      <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-hairline)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {fijas.length > 0 && <th className="px-2 py-2">Criterio</th>}
              {columnas.map((c) => (
                <th key={c.clave} className="min-w-32 px-2 py-2">
                  {c.etiqueta}
                  {c.requerido && (fijas.length === 0 || campo.requerido) && " *"}
                </th>
              ))}
              {fijas.length === 0 && <th className="px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                {fijas.length > 0 && (
                  <td className="min-w-48 px-2 py-2 align-top">
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {fila.etiqueta}
                    </p>
                    {fila.descripcion && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fila.descripcion}
                      </p>
                    )}
                  </td>
                )}
                {columnas.map((col) => (
                  <td key={col.clave} className="px-2 py-2 align-top">
                    <Control
                      campo={col}
                      name={nombreCelda(campo.clave, fila.id, col.clave)}
                      valor={fila.previa?.[col.clave]}
                      requerido={Boolean(col.requerido && fijas.length > 0 && campo.requerido)}
                      onNumero={
                        col.tipo === "numero" ? (n) => onColumnaNumerica(campo.clave, fila.id, col.clave, n) : undefined
                      }
                    />
                  </td>
                ))}
                {fijas.length === 0 && (
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => setFilasLibres((prev) => prev.filter((i) => String(i) !== fila.id))}
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: "var(--status-critical)" }}
                      aria-label="Quitar fila"
                    >
                      Quitar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fijas.length === 0 && (
        <button
          type="button"
          onClick={() => setFilasLibres((prev) => [...prev, (prev.length ? Math.max(...prev) : -1) + 1])}
          className="self-start text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--brand-primary)" }}
        >
          + Agregar fila
        </button>
      )}
    </div>
  );
}

function CampoFirma({ campo, valor, rol }: { campo: CampoRuntime; valor: unknown; rol: Rol }) {
  const previa = (valor ?? null) as FirmaValor | null;
  const habilitado = puedeFirmar(rol, campo.firmante);
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-3 sm:col-span-2" style={{ borderColor: "var(--border-hairline)" }}>
      <label htmlFor={campo.clave} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {campo.etiqueta}
        {campo.requerido && " *"}
      </label>
      {previa && (
        <p className="text-xs" style={{ color: "var(--status-good)" }}>
          Firmado por {previa.nombre} · registrado por {previa.firmadoPorNombre} el{" "}
          {new Date(previa.fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}
      {habilitado ? (
        <>
          <input
            id={campo.clave}
            name={campo.clave}
            type="text"
            placeholder="Nombre completo de quien firma"
            defaultValue={previa?.nombre ?? ""}
            className={inputClass}
            style={baseStyle}
          />
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" name={`${campo.clave}__confirmo`} className="h-4 w-4" />
            Confirmo que firmo este formato — quedará registrado con mi usuario, la fecha y la hora.
          </label>
        </>
      ) : (
        !previa && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Pendiente — la pone {campo.firmante === "asesor" ? "el asesor" : "el emprendedor"}.
          </p>
        )
      )}
    </div>
  );
}

export function InstrumentoForm({
  instrumentoId,
  emprendedorId,
  respuestaId,
  campos,
  datosPrevios,
  rol,
  onDone,
}: {
  instrumentoId: string;
  emprendedorId: string;
  respuestaId?: string;
  campos: CampoRuntime[];
  datosPrevios?: Record<string, unknown>;
  rol: Rol;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(guardarRespuestaInstrumento, initialState);
  const [numeros, setNumeros] = useState<Record<string, number>>(() => {
    const ini: Record<string, number> = {};
    for (const c of campos) {
      if (c.tipo !== "tabla" || !Array.isArray(datosPrevios?.[c.clave])) continue;
      (datosPrevios[c.clave] as Record<string, unknown>[]).forEach((f, i) => {
        for (const col of c.columnas ?? []) {
          if (typeof f[col.clave] === "number") ini[`${c.clave}|${(f.fila as string) ?? i}|${col.clave}`] = f[col.clave] as number;
        }
      });
    }
    return ini;
  });

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  const total = (tabla: string, columna: string) =>
    Object.entries(numeros)
      .filter(([k]) => k.startsWith(`${tabla}|`) && k.endsWith(`|${columna}`))
      .reduce((acc, [, v]) => acc + v, 0);

  return (
    <form
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <input type="hidden" name="instrumentoId" value={instrumentoId} />
      <input type="hidden" name="emprendedorId" value={emprendedorId} />
      {respuestaId && <input type="hidden" name="respuestaId" value={respuestaId} />}

      {campos.map((campo) => {
        const valor = datosPrevios?.[campo.clave];
        if (campo.tipo === "tabla") {
          return (
            <CampoTabla
              key={campo.clave}
              campo={campo}
              valor={valor}
              onColumnaNumerica={(t, f, c, n) => setNumeros((prev) => ({ ...prev, [`${t}|${f}|${c}`]: n }))}
            />
          );
        }
        if (campo.tipo === "firma") return <CampoFirma key={campo.clave} campo={campo} valor={valor} rol={rol} />;
        if (campo.tipo === "total") {
          const t = campo.sumaDe ? total(campo.sumaDe.tabla, campo.sumaDe.columna) : 0;
          return (
            <div key={campo.clave} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {campo.etiqueta}
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--brand-ink)" }}>
                {t}
                {campo.max !== undefined && ` / ${campo.max}`}
              </p>
            </div>
          );
        }
        if (campo.tipo === "booleano") {
          return (
            <div key={campo.clave} className="flex items-center gap-2 pt-5">
              <input id={campo.clave} name={campo.clave} type="checkbox" defaultChecked={valor === true} className="h-4 w-4" />
              <label htmlFor={campo.clave} className="text-sm" style={{ color: "var(--text-primary)" }}>
                {campo.etiqueta}
                {campo.requerido && " *"}
              </label>
            </div>
          );
        }
        return (
          <div key={campo.clave} className={`flex flex-col gap-1.5 ${campo.tipo === "textarea" ? "sm:col-span-2" : ""}`}>
            <label htmlFor={campo.clave} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {campo.etiqueta}
              {campo.requerido && " *"}
            </label>
            <Control campo={campo} name={campo.clave} valor={valor} requerido={campo.requerido} />
            <Ayuda texto={campo.ayuda} />
          </div>
        );
      })}

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
