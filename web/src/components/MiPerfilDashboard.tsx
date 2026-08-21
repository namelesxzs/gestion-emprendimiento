import { Card } from "./Card";
import { EtapaBadge } from "./EtapaBadge";
import { AvanceMeter } from "./AvanceMeter";
import { StatTile } from "./StatTile";
import { ProximasReuniones } from "./ProximasReuniones";
import type { Acompanamiento, Emprendedor, Reunion } from "@/lib/types";
import { getProximasReuniones, getUltimoAvance } from "@/lib/view";

// Vista de solo lectura para el rol EMPRENDEDOR: solo su propio progreso,
// nunca datos de otros (RF13). Los datos que recibe ya vienen acotados a un
// único emprendedor desde la consulta a la base, no se filtran aquí.
export function MiPerfilDashboard({
  emprendedor,
  acompanamientos,
  reuniones,
}: {
  emprendedor: Emprendedor;
  acompanamientos: Acompanamiento[];
  reuniones: Reunion[];
}) {
  const avance = getUltimoAvance(acompanamientos, emprendedor.id) ?? 0;
  const proximasReuniones = getProximasReuniones(reuniones, [emprendedor]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Etapa actual" value={emprendedor.etapa} accent="var(--etapa-descubrir)" />
        <StatTile label="Avance" value={`${avance}%`} accent="var(--etapa-fomentar)" />
        <StatTile label="Acompañamientos" value={acompanamientos.length} accent="var(--etapa-formar)" />
        <StatTile label="Reuniones" value={reuniones.length} accent="var(--status-good)" />
      </div>

      <Card title={emprendedor.nombre} subtitle={`${emprendedor.emprendimiento} · ${emprendedor.sector}`}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Etapa</p>
            <div className="mt-1"><EtapaBadge etapa={emprendedor.etapa} /></div>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Responsable</p>
            <p style={{ color: "var(--text-secondary)" }}>{emprendedor.responsable}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fecha de ingreso</p>
            <p style={{ color: "var(--text-secondary)" }}>{emprendedor.fechaIngreso}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avance</p>
            <div className="mt-1"><AvanceMeter pct={avance} /></div>
          </div>
        </div>
      </Card>

      <Card title="Próximas reuniones" subtitle="Programadas o reagendadas">
        <ProximasReuniones reuniones={proximasReuniones} />
      </Card>
    </>
  );
}
