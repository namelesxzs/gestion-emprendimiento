import type { Acompanamiento, Emprendedor, Etapa, Reunion } from "@/lib/types";

export const ETAPA_ORDER: Etapa[] = ["Descubrir", "Incubar", "Formar", "Fomentar", "Financiar"];

export function getEtapaDistribution(emprendedores: Emprendedor[]): { etapa: Etapa; count: number }[] {
  return ETAPA_ORDER.map((etapa) => ({
    etapa,
    count: emprendedores.filter((e) => e.etapa === etapa).length,
  }));
}

export function getKpis(emprendedores: Emprendedor[], acompanamientos: Acompanamiento[]) {
  const totalEmprendedores = emprendedores.length;
  const activos = emprendedores.filter((e) => e.estado === "Activo").length;
  const totalAcompanamientos = acompanamientos.length;
  const avancePromedio = totalAcompanamientos
    ? Math.round(acompanamientos.reduce((sum, a) => sum + a.avancePct, 0) / totalAcompanamientos)
    : 0;

  return { totalEmprendedores, activos, totalAcompanamientos, avancePromedio };
}

export function getUltimoAvance(acompanamientos: Acompanamiento[], emprendedorId: string): number | undefined {
  const historial = getAcompanamientosByEmprendedor(acompanamientos, emprendedorId);
  return historial[0]?.avancePct;
}

export function getAcompanamientosByEmprendedor(
  acompanamientos: Acompanamiento[],
  emprendedorId: string
): Acompanamiento[] {
  return acompanamientos
    .filter((a) => a.emprendedorId === emprendedorId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function getReunionesByEmprendedor(reuniones: Reunion[], emprendedorId: string): Reunion[] {
  return reuniones
    .filter((r) => r.emprendedorId === emprendedorId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function getProximasReuniones(reuniones: Reunion[], emprendedores: Emprendedor[]) {
  return reuniones
    .filter((r) => r.estado === "Programada" || r.estado === "Reagendada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({
      ...r,
      emprendedorNombre: emprendedores.find((e) => e.id === r.emprendedorId)?.nombre ?? "—",
    }));
}
