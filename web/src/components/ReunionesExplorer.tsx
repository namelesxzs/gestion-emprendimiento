"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Emprendedor, Reunion } from "@/lib/types";
import { Card } from "./Card";
import { CalendarioMensual } from "./CalendarioMensual";
import { NuevaReunionForm } from "./NuevaReunionForm";
import { ReunionRow } from "./ReunionRow";

export function ReunionesExplorer({
  emprendedores,
  reuniones,
}: {
  emprendedores: Emprendedor[];
  reuniones: Reunion[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: session } = useSession();
  const puedeGestionar = session?.user.rol === "ADMINISTRADOR" || session?.user.rol === "DOCENTE";

  const emprendedorPorId = useMemo(() => {
    const map = new Map<string, Emprendedor>();
    for (const e of emprendedores) map.set(e.id, e);
    return map;
  }, [emprendedores]);

  const reunionesConNombre = useMemo(
    () =>
      reuniones.map((r) => ({
        ...r,
        emprendedorNombre: emprendedorPorId.get(r.emprendedorId)?.nombre ?? "—",
      })),
    [reuniones, emprendedorPorId]
  );

  const listaVisible = useMemo(() => {
    const base = selectedDate
      ? reunionesConNombre.filter((r) => r.fecha === selectedDate)
      : reunionesConNombre.filter((r) => r.estado === "Programada" || r.estado === "Reagendada");
    return [...base].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  }, [reunionesConNombre, selectedDate]);

  return (
    <div className="flex flex-col gap-4">
      {puedeGestionar && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {showForm ? "Cerrar formulario" : "+ Nueva reunión"}
          </button>
        </div>
      )}

      {showForm && puedeGestionar && (
        <NuevaReunionForm
          emprendedores={emprendedores}
          fechaSugerida={selectedDate}
          onDone={() => setShowForm(false)}
        />
      )}

      <Card title="Calendario" subtitle="Clic en un día para filtrar las reuniones de esa fecha">
        <CalendarioMensual
          reuniones={reuniones}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </Card>

      <Card
        title={selectedDate ? `Reuniones del ${selectedDate}` : "Próximas reuniones"}
        subtitle={
          selectedDate
            ? `${listaVisible.length} reunión${listaVisible.length === 1 ? "" : "es"}`
            : "Programadas o reagendadas — selecciona un día en el calendario para ver el detalle"
        }
      >
        {listaVisible.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No hay reuniones para mostrar.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {listaVisible.map((r) => (
              <ReunionRow key={r.id} reunion={r} puedeGestionar={puedeGestionar} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
