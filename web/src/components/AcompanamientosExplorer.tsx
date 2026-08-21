"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Acompanamiento, Emprendedor } from "@/lib/types";
import { getAcompanamientosByEmprendedor } from "@/lib/view";
import { Card } from "./Card";
import { AcompanamientoCard } from "./AcompanamientoCard";
import { FilterChip } from "./FilterChip";
import { NuevoAcompanamientoForm } from "./NuevoAcompanamientoForm";
import { ETAPA_COLOR_VAR } from "./etapa-colors";

export function AcompanamientosExplorer({
  emprendedores,
  acompanamientos,
}: {
  emprendedores: Emprendedor[];
  acompanamientos: Acompanamiento[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(emprendedores[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const selected = emprendedores.find((e) => e.id === selectedId) ?? null;
  const historial = selected ? getAcompanamientosByEmprendedor(acompanamientos, selected.id) : [];

  const { data: session } = useSession();
  const puedeRegistrar = session?.user.rol === "ADMINISTRADOR" || session?.user.rol === "DOCENTE";

  return (
    <div className="flex flex-col gap-4">
      {emprendedores.length > 1 && (
        <Card title="Emprendedor">
          <div className="flex flex-wrap gap-2">
            {emprendedores.map((e) => (
              <FilterChip
                key={e.id}
                label={e.nombre}
                active={e.id === selectedId}
                color={ETAPA_COLOR_VAR[e.etapa]}
                onClick={() => {
                  setSelectedId(e.id);
                  setShowForm(false);
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {puedeRegistrar && selected && !showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            + Nuevo acompañamiento
          </button>
        </div>
      )}

      {puedeRegistrar && selected && showForm && (
        <NuevoAcompanamientoForm emprendedor={selected} onDone={() => setShowForm(false)} />
      )}

      <Card
        title={selected ? `Historial de ${selected.nombre}` : "Historial"}
        subtitle={
          selected
            ? `${historial.length} acompañamiento${historial.length === 1 ? "" : "s"} registrado${historial.length === 1 ? "" : "s"}, del más reciente al más antiguo`
            : undefined
        }
      >
        {historial.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Este emprendedor no tiene acompañamientos registrados todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {historial.map((a) => (
              <AcompanamientoCard key={a.id} acompanamiento={a} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
