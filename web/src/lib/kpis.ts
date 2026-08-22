import type { Compromiso, Emprendedor, Reunion } from "@/lib/types";

export function getCumplimientoCompromisos(compromisos: Compromiso[]) {
  const total = compromisos.length;
  const cumplidos = compromisos.filter((c) => c.estado === "Cumplido").length;
  const hoy = new Date().toISOString().slice(0, 10);
  const vencidos = compromisos.filter((c) => c.estado !== "Cumplido" && c.fechaCompromiso < hoy).length;
  const pctCumplimiento = total ? Math.round((cumplidos / total) * 100) : 0;

  return { total, cumplidos, vencidos, pctCumplimiento };
}

const ESTADOS_REUNION = ["Realizada", "Programada", "Reagendada", "Cancelada"] as const;

export function getEfectividadReuniones(reuniones: Reunion[]) {
  const total = reuniones.length;
  const porEstado = ESTADOS_REUNION.map((estado) => ({
    estado,
    count: reuniones.filter((r) => r.estado === estado).length,
  }));
  const realizadas = porEstado.find((e) => e.estado === "Realizada")?.count ?? 0;
  const canceladas = porEstado.find((e) => e.estado === "Cancelada")?.count ?? 0;
  // La efectividad solo tiene sentido sobre reuniones ya resueltas
  // (Realizada o Cancelada); las Programadas/Reagendadas aún no ocurrieron.
  const resueltas = realizadas + canceladas;
  const pctEfectividad = resueltas ? Math.round((realizadas / resueltas) * 100) : 0;

  return { total, porEstado, pctEfectividad };
}

export function getDistribucionSector(emprendedores: Emprendedor[]) {
  const mapa = new Map<string, number>();
  for (const e of emprendedores) {
    mapa.set(e.sector, (mapa.get(e.sector) ?? 0) + 1);
  }
  return Array.from(mapa.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
}

/** Últimos `meses` meses (incluyendo el actual), en orden cronológico,
 * contando por fechaIngreso — para mostrar la tendencia de altas. */
export function getIngresosPorMes(emprendedores: Emprendedor[], meses = 6) {
  const hoy = new Date();
  const periodos: { key: string; label: string }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
    periodos.push({ key, label });
  }

  const conteo = new Map<string, number>();
  for (const e of emprendedores) {
    const key = e.fechaIngreso.slice(0, 7);
    conteo.set(key, (conteo.get(key) ?? 0) + 1);
  }

  return periodos.map(({ key, label }) => ({ mes: label, count: conteo.get(key) ?? 0 }));
}
