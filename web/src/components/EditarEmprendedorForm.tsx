"use client";

import { useActionState, useEffect } from "react";
import { editarEmprendedor, type EditarEmprendedorState } from "@/app/emprendedores/actions";
import {
  ETAPAS,
  ESTADOS_EMPRENDEDOR,
  TIPOS_INNOVACION,
  NIVELES_MADUREZ,
  CANALES_POSTULACION,
} from "@/lib/validation/emprendedor";
import { SEDES } from "@/lib/validation/usuario";
import type { Cohorte, Emprendedor } from "@/lib/types";
import type { FaseRow } from "@/lib/queries";
import { Card } from "./Card";
import { FormField, FormTextArea } from "./FormField";

const initialState: EditarEmprendedorState = {};

function Selector({
  name,
  label,
  opciones,
  defaultValue,
}: {
  name: string;
  label: string;
  opciones: readonly string[];
  defaultValue?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
      >
        <option value="">Sin especificar</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EditarEmprendedorForm({
  emprendedor,
  onDone,
  fases,
  cohortes,
}: {
  emprendedor: Emprendedor;
  onDone: () => void;
  fases: FaseRow[];
  cohortes: Cohorte[];
}) {
  const [state, formAction, isPending] = useActionState(editarEmprendedor, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  return (
    <Card title={`Editar ${emprendedor.nombre}`}>
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={emprendedor.id} />
        <FormField label="Nombre" name="nombre" required defaultValue={emprendedor.nombre} />
        <FormField
          label="Emprendimiento"
          name="emprendimiento"
          required
          defaultValue={emprendedor.emprendimiento}
        />
        <FormField label="Sector" name="sector" required defaultValue={emprendedor.sector} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="etapa" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Etapa
          </label>
          <select
            id="etapa"
            name="etapa"
            required
            defaultValue={emprendedor.etapa}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {ETAPAS.map((etapa) => (
              <option key={etapa} value={etapa}>
                {etapa}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="estado" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            required
            defaultValue={emprendedor.estado}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            {ESTADOS_EMPRENDEDOR.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="Fecha de ingreso"
          name="fechaIngreso"
          type="date"
          required
          defaultValue={emprendedor.fechaIngreso}
        />
        <FormField label="Correo" name="correo" type="email" required defaultValue={emprendedor.correo} />
        <FormField label="Teléfono" name="telefono" required defaultValue={emprendedor.telefono} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="faseId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Fase (opcional — eje independiente de la etapa)
          </label>
          <select
            id="faseId"
            name="faseId"
            defaultValue={emprendedor.faseId ?? ""}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="">Sin asignar</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cohorteId" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Cohorte (opcional)
          </label>
          <select
            id="cohorteId"
            name="cohorteId"
            defaultValue={emprendedor.cohorteId ?? ""}
            className="rounded-md border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="">Sin asignar</option>
            {cohortes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide sm:col-span-2" style={{ color: "var(--brand-primary)" }}>
          Ficha de caracterización (Manual 6.2 — opcional)
        </p>
        <Selector name="sede" label="Sede" opciones={SEDES} defaultValue={emprendedor.sede} />
        <FormField label="Programa académico" name="programaAcademico" defaultValue={emprendedor.programaAcademico ?? ""} />
        <FormField label="Facultad" name="facultad" defaultValue={emprendedor.facultad ?? ""} />
        <Selector name="tipoInnovacion" label="Tipo de innovación" opciones={TIPOS_INNOVACION} defaultValue={emprendedor.tipoInnovacion} />
        <Selector name="madurez" label="Madurez del emprendimiento" opciones={NIVELES_MADUREZ} defaultValue={emprendedor.madurez} />
        <Selector name="canalPostulacion" label="Canal de postulación" opciones={CANALES_POSTULACION} defaultValue={emprendedor.canalPostulacion} />
        <FormTextArea label="Problema que busca resolver" name="problema" defaultValue={emprendedor.problema ?? ""} />
        <FormTextArea label="Descripción de la idea de negocio" name="descripcionIdea" defaultValue={emprendedor.descripcionIdea ?? ""} />

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
            {isPending ? "Guardando..." : "Guardar cambios"}
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
    </Card>
  );
}
