import { prisma } from "@/lib/prisma";
import type {
  Acompanamiento,
  Emprendedor,
  Etapa,
  EstadoCompromiso,
  EstadoEmprendedor,
  EstadoReunion,
  Reunion,
} from "@/lib/types";

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getEmprendedores(): Promise<Emprendedor[]> {
  const rows = await prisma.emprendedor.findMany({
    include: { responsable: true },
    orderBy: { nombre: "asc" },
  });

  return rows.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    emprendimiento: e.emprendimiento,
    sector: e.sector,
    etapa: e.etapa as Etapa,
    estado: e.estado as EstadoEmprendedor,
    fechaIngreso: fmtDate(e.fechaIngreso),
    responsable: e.responsable?.nombre ?? "—",
    correo: e.correo,
    telefono: e.telefono,
  }));
}

export async function getAllAcompanamientos(): Promise<Acompanamiento[]> {
  const rows = await prisma.acompanamiento.findMany({
    include: { compromisos: true },
    orderBy: { fecha: "desc" },
  });

  return rows.map((a) => {
    const compromiso = a.compromisos[0];
    return {
      id: a.id,
      emprendedorId: a.emprendedorId,
      fecha: fmtDate(a.fecha),
      etapa: a.etapa as Etapa,
      diagnostico: a.diagnostico,
      recomendaciones: a.recomendaciones,
      compromisos: a.compromisos.map((c) => c.descripcion).join("; ") || "—",
      avancePct: a.avancePct,
      estado: (compromiso?.estado as EstadoCompromiso) ?? "Cumplido",
    };
  });
}

export async function getAllReuniones(): Promise<Reunion[]> {
  const rows = await prisma.reunion.findMany({ orderBy: { fecha: "desc" } });

  return rows.map((r) => ({
    id: r.id,
    emprendedorId: r.emprendedorId,
    fecha: fmtDate(r.fecha),
    hora: r.hora,
    estado: r.estado as EstadoReunion,
    accion: r.accion,
    observaciones: r.observaciones,
  }));
}
