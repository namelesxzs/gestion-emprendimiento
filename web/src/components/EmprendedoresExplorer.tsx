"use client";

import { useMemo, useState } from "react";
import type { Acompanamiento, Emprendedor, Etapa, EstadoEmprendedor, Reunion } from "@/lib/types";
import { ETAPA_ORDER, getAcompanamientosByEmprendedor, getReunionesByEmprendedor } from "@/lib/view";
import { EmprendedoresTable } from "./EmprendedoresTable";
import { FilterChip } from "./FilterChip";
import { EtapaBadge } from "./EtapaBadge";
import { Card } from "./Card";
import { ETAPA_COLOR_VAR } from "./etapa-colors";

interface Row extends Emprendedor {
  avance?: number;
}

const ESTADOS: EstadoEmprendedor[] = ["Activo", "Graduado", "Inactivo"];

export function EmprendedoresExplorer({
  rows,
  acompanamientos,
  reuniones,
}: {
  rows: Row[];
  acompanamientos: Acompanamiento[];
  reuniones: Reunion[];
}) {
  const [etapaFilter, setEtapaFilter] = useState<Set<Etapa>>(new Set(ETAPA_ORDER));
  const [estadoFilter, setEstadoFilter] = useState<Set<EstadoEmprendedor>>(
    new Set(["Activo", "Graduado"])
  );
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);

  const filteredRows = useMemo(
    () => rows.filter((r) => etapaFilter.has(r.etapa) && estadoFilter.has(r.estado)),
    [rows, etapaFilter, estadoFilter]
  );

  const selected =
    filteredRows.find((r) => r.id === selectedId) ?? filteredRows[0] ?? null;

  function toggleEtapa(etapa: Etapa) {
    setEtapaFilter((prev) => {
      const next = new Set(prev);
      if (next.has(etapa)) next.delete(etapa);
      else next.add(etapa);
      return next;
    });
  }

  function toggleEstado(estado: EstadoEmprendedor) {
    setEstadoFilter((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) next.delete(estado);
      else next.add(estado);
      return next;
    });
  }

  const acompanamientosSeleccionado = selected
    ? getAcompanamientosByEmprendedor(acompanamientos, selected.id)
    : [];
  const reunionesSeleccionado = selected ? getReunionesByEmprendedor(reuniones, selected.id) : [];
  const ultimoAcompanamiento = acompanamientosSeleccionado[0];

  return (
    <div className="flex flex-col gap-4">
      <Card title="Filtros">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {ETAPA_ORDER.map((etapa) => (
              <FilterChip
                key={etapa}
                label={etapa}
                active={etapaFilter.has(etapa)}
                color={ETAPA_COLOR_VAR[etapa]}
                onClick={() => toggleEtapa(etapa)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((estado) => (
              <FilterChip
                key={estado}
                label={estado}
                active={estadoFilter.has(estado)}
                onClick={() => toggleEstado(estado)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Listado"
        subtitle={`${filteredRows.length} emprendedor${filteredRows.length === 1 ? "" : "es"} — clic en una fila para ver el detalle`}
      >
        {filteredRows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Ningún emprendedor coincide con los filtros seleccionados.
          </p>
        ) : (
          <EmprendedoresTable
            rows={filteredRows}
            selectedId={selected?.id}
            onSelect={(row) => setSelectedId(row.id)}
          />
        )}
      </Card>

      {selected && (
        <Card
          title={selected.nombre}
          subtitle={`${selected.emprendimiento} · ${selected.sector}`}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Etapa actual</p>
                <div className="mt-1"><EtapaBadge etapa={selected.etapa} /></div>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Acompañamientos</p>
                <p style={{ color: "var(--text-primary)" }}>{acompanamientosSeleccionado.length}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reuniones</p>
                <p style={{ color: "var(--text-primary)" }}>{reunionesSeleccionado.length}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Último avance</p>
                <p style={{ color: "var(--text-primary)" }}>
                  {ultimoAcompanamiento ? `${ultimoAcompanamiento.avancePct}%` : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Responsable</p>
                <p style={{ color: "var(--text-secondary)" }}>{selected.responsable}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Correo</p>
                <p style={{ color: "var(--text-secondary)" }}>{selected.correo}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Teléfono</p>
                <p style={{ color: "var(--text-secondary)" }}>{selected.telefono}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fecha de ingreso</p>
                <p style={{ color: "var(--text-secondary)" }}>{selected.fechaIngreso}</p>
              </div>
            </div>

            {ultimoAcompanamiento ? (
              <div
                className="rounded-md border p-3 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Último acompañamiento · {ultimoAcompanamiento.fecha}
                </p>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                  {ultimoAcompanamiento.diagnostico}
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Todavía no tiene acompañamientos registrados.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
