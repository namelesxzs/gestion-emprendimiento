import { StatTile } from "./StatTile";
import { Card } from "./Card";
import { EtapaBarChart } from "./EtapaBarChart";
import { BarList } from "./BarList";
import { TrendBarChart } from "./TrendBarChart";
import type { Acompanamiento, Compromiso, Emprendedor, Reunion } from "@/lib/types";
import type { EmprendedoresPorSede } from "@/lib/queries";
import {
  getDistribucionSector,
  getEfectividadReuniones,
  getCumplimientoCompromisos,
  getIngresosPorMes,
} from "@/lib/kpis";
import { getEtapaDistribution, getKpis } from "@/lib/view";

export function IndicadoresDashboard({
  emprendedores,
  acompanamientos,
  reuniones,
  compromisos,
  emprendedoresPorSede,
}: {
  emprendedores: Emprendedor[];
  acompanamientos: Acompanamiento[];
  reuniones: Reunion[];
  compromisos: Compromiso[];
  emprendedoresPorSede: EmprendedoresPorSede[];
}) {
  const kpis = getKpis(emprendedores, acompanamientos);
  const distribucionEtapa = getEtapaDistribution(emprendedores);
  const distribucionSector = getDistribucionSector(emprendedores);
  const ingresosPorMes = getIngresosPorMes(emprendedores);
  const cumplimiento = getCumplimientoCompromisos(compromisos);
  const efectividad = getEfectividadReuniones(reuniones);

  const sedeBarData = emprendedoresPorSede.map((s) => ({
    label: s.sede,
    count: s.total,
    sublabel: `${s.activos} activos`,
  }));

  const reunionBarData = efectividad.porEstado.map((e) => ({ label: e.estado, count: e.count }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total emprendedores" value={kpis.totalEmprendedores} accent="var(--etapa-descubrir)" />
        <StatTile label="Emprendedores activos" value={kpis.activos} accent="var(--status-good)" />
        <StatTile label="Acompañamientos" value={kpis.totalAcompanamientos} accent="var(--etapa-formar)" />
        <StatTile label="Avance promedio" value={`${kpis.avancePromedio}%`} accent="var(--etapa-fomentar)" />
        <StatTile
          label="Cumplimiento compromisos"
          value={`${cumplimiento.pctCumplimiento}%`}
          accent="var(--brand-primary)"
        />
        <StatTile
          label="Efectividad reuniones"
          value={`${efectividad.pctEfectividad}%`}
          accent="var(--etapa-incubar)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Emprendedores por etapa" subtitle="Distribución sobre la cadena de valor institucional">
          <EtapaBarChart data={distribucionEtapa} />
        </Card>
        <Card title="Emprendedores por sede" subtitle="Según la sede del docente responsable">
          <BarList data={sedeBarData} color="var(--brand-primary)" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Distribución por sector" subtitle="Sectores económicos representados">
          <BarList data={distribucionSector.map((s) => ({ label: s.sector, count: s.count }))} color="var(--etapa-fomentar)" />
        </Card>
        <Card title="Ingresos por mes" subtitle="Emprendedores nuevos registrados, últimos 6 meses">
          <TrendBarChart data={ingresosPorMes} color="var(--etapa-descubrir)" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Cumplimiento de compromisos"
          subtitle={`${cumplimiento.cumplidos} de ${cumplimiento.total} compromisos cumplidos`}
        >
          <div className="flex items-center gap-6">
            <p className="text-4xl font-bold tabular-nums" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-brand)" }}>
              {cumplimiento.pctCumplimiento}%
            </p>
            <p className="text-sm" style={{ color: cumplimiento.vencidos > 0 ? "var(--status-critical)" : "var(--text-secondary)" }}>
              {cumplimiento.vencidos} compromiso{cumplimiento.vencidos === 1 ? "" : "s"} vencido
              {cumplimiento.vencidos === 1 ? "" : "s"} sin cumplir
            </p>
          </div>
        </Card>
        <Card title="Reuniones por estado" subtitle={`${efectividad.total} reuniones registradas en total`}>
          <BarList data={reunionBarData} color="var(--etapa-formar)" />
        </Card>
      </div>
    </div>
  );
}
