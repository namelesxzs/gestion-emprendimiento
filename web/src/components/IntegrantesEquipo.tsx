"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  agregarIntegranteEquipo,
  eliminarIntegranteEquipo,
  type IntegranteEquipoState,
} from "@/app/emprendedores/actions";
import type { IntegranteEquipo } from "@/lib/types";
import { Card } from "./Card";
import { FormField } from "./FormField";

const initialAgregar: IntegranteEquipoState = {};
const initialEliminar: IntegranteEquipoState = {};

function AgregarIntegranteForm({ emprendedorId, onDone }: { emprendedorId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(agregarIntegranteEquipo, initialAgregar);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-3"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <input type="hidden" name="emprendedorId" value={emprendedorId} />
      <FormField label="Nombre" name="nombre" required />
      <FormField label="Documento" name="documento" />
      <FormField label="Rol en el equipo" name="rolEquipo" />
      <FormField label="Programa académico" name="programaAcademico" />
      <FormField label="Semestre" name="semestre" />
      <FormField label="Correo" name="correo" type="email" />
      <FormField label="Teléfono" name="telefono" />

      {state.error && (
        <p className="sm:col-span-3 text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      <div className="flex gap-3 sm:col-span-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {isPending ? "Agregando..." : "Agregar integrante"}
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

function IntegranteRow({ integrante, puedeEditar }: { integrante: IntegranteEquipo; puedeEditar: boolean }) {
  const [state, formAction, isPending] = useActionState(eliminarIntegranteEquipo, initialEliminar);

  return (
    <li className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            {integrante.nombre}
            {integrante.rolEquipo && (
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                {integrante.rolEquipo}
              </span>
            )}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {[integrante.programaAcademico, integrante.semestre && `semestre ${integrante.semestre}`]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {[integrante.documento, integrante.correo, integrante.telefono].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {puedeEditar && (
          <form action={formAction}>
            <input type="hidden" name="id" value={integrante.id} />
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-bold uppercase tracking-wide disabled:opacity-60"
              style={{ color: "var(--status-critical)" }}
            >
              {isPending ? "..." : "Quitar"}
            </button>
          </form>
        )}
      </div>
      {state.error && (
        <p className="mt-1 text-xs" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}
    </li>
  );
}

/** Equipo emprendedor (Manual 6.1) — varios integrantes por emprendimiento,
 * más allá del contacto principal que ya vive en Emprendedor. */
export function IntegrantesEquipo({
  emprendedorId,
  integrantes,
  puedeEditar,
}: {
  emprendedorId: string;
  integrantes: IntegranteEquipo[];
  puedeEditar: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      title="Equipo emprendedor"
      subtitle="Integrantes del equipo más allá del contacto principal (Manual 6.1)"
      action={
        puedeEditar && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--brand-primary)" }}
          >
            {showForm ? "Cerrar" : "+ Agregar integrante"}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {showForm && <AgregarIntegranteForm emprendedorId={emprendedorId} onDone={() => setShowForm(false)} />}

        {integrantes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Solo está registrado el contacto principal — todavía no se han agregado más integrantes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {integrantes.map((i) => (
              <IntegranteRow key={i.id} integrante={i} puedeEditar={puedeEditar} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
