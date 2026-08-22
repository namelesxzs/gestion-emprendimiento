import { prisma } from "@/lib/prisma";
import type {
  Acompanamiento,
  Compromiso,
  Docente,
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

/**
 * `soloEmprendedorId` acota la consulta a un único emprendedor — se usa
 * para el rol EMPRENDEDOR, que nunca debe recibir datos de otros (RF13).
 * El filtro se aplica en la consulta misma, no después de traer todo.
 */
export async function getEmprendedores(soloEmprendedorId?: string): Promise<Emprendedor[]> {
  const rows = await prisma.emprendedor.findMany({
    where: soloEmprendedorId ? { id: soloEmprendedorId } : undefined,
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

export async function getEmprendedorById(id: string): Promise<Emprendedor | null> {
  const rows = await getEmprendedores(id);
  return rows[0] ?? null;
}

export async function getAllAcompanamientos(soloEmprendedorId?: string): Promise<Acompanamiento[]> {
  const rows = await prisma.acompanamiento.findMany({
    where: soloEmprendedorId ? { emprendedorId: soloEmprendedorId } : undefined,
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

export async function getAllReuniones(soloEmprendedorId?: string): Promise<Reunion[]> {
  const rows = await prisma.reunion.findMany({
    where: soloEmprendedorId ? { emprendedorId: soloEmprendedorId } : undefined,
    orderBy: { fecha: "desc" },
  });

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

/** Vista plana de Compromiso (sin pasar por Acompanamiento) — la usan los
 * KPIs institucionales de cumplimiento, que necesitan cada compromiso por
 * separado y no solo el primero, como sí hace getAllAcompanamientos. */
export async function getAllCompromisos(): Promise<Compromiso[]> {
  const rows = await prisma.compromiso.findMany({
    orderBy: { fechaCompromiso: "desc" },
  });

  return rows.map((c) => ({
    id: c.id,
    acompanamientoId: c.acompanamientoId,
    descripcion: c.descripcion,
    fechaCompromiso: fmtDate(c.fechaCompromiso),
    fechaCumplimiento: c.fechaCumplimiento ? fmtDate(c.fechaCumplimiento) : null,
    estado: c.estado as EstadoCompromiso,
  }));
}

export async function getDocentes(): Promise<Docente[]> {
  const rows = await prisma.usuario.findMany({
    where: { rol: "DOCENTE" },
    orderBy: { nombre: "asc" },
  });

  return rows.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    correo: d.correo,
    sede: d.sede,
    activo: d.activo,
  }));
}

export interface EmprendedoresPorSede {
  sede: string;
  total: number;
  activos: number;
}

/** Agregación por sede del Docente responsable — no viaja por el tipo
 * Emprendedor (que no expone sede) porque solo la usa el panel de
 * indicadores institucionales. */
export async function getEmprendedoresPorSede(): Promise<EmprendedoresPorSede[]> {
  const rows = await prisma.emprendedor.findMany({
    select: { estado: true, responsable: { select: { sede: true } } },
  });

  const mapa = new Map<string, EmprendedoresPorSede>();
  for (const r of rows) {
    const sede = r.responsable?.sede ?? "Sin sede asignada";
    const actual = mapa.get(sede) ?? { sede, total: 0, activos: 0 };
    actual.total += 1;
    if (r.estado === "Activo") actual.activos += 1;
    mapa.set(sede, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

export interface AuditLogRow {
  id: string;
  createdAt: string;
  usuarioNombre: string | null;
  rolSnapshot: string | null;
  entidad: string;
  entidadId: string;
  accion: string;
  origen: string;
  resultado: string;
  valorAnterior: Record<string, unknown> | null;
  valorNuevo: Record<string, unknown> | null;
}

export interface AuditLogFiltros {
  entidad?: string;
  accion?: string;
  origen?: string;
  resultado?: string;
  usuarioId?: string;
  desde?: string;
  hasta?: string;
}

const AUDIT_PAGE_SIZE = 25;

export async function getAuditLogs(filtros: AuditLogFiltros, page: number) {
  const where = {
    entidad: filtros.entidad || undefined,
    accion: filtros.accion || undefined,
    origen: filtros.origen || undefined,
    resultado: filtros.resultado || undefined,
    usuarioId: filtros.usuarioId || undefined,
    createdAt:
      filtros.desde || filtros.hasta
        ? {
            gte: filtros.desde ? new Date(`${filtros.desde}T00:00:00`) : undefined,
            lte: filtros.hasta ? new Date(`${filtros.hasta}T23:59:59`) : undefined,
          }
        : undefined,
  };

  const paginaActual = Math.max(1, page);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { usuario: { select: { nombre: true } } },
      orderBy: { createdAt: "desc" },
      skip: (paginaActual - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const logs: AuditLogRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }),
    usuarioNombre: r.usuario?.nombre ?? null,
    rolSnapshot: r.rolSnapshot,
    entidad: r.entidad,
    entidadId: r.entidadId,
    accion: r.accion,
    origen: r.origen,
    resultado: r.resultado,
    valorAnterior: r.valorAnterior as Record<string, unknown> | null,
    valorNuevo: r.valorNuevo as Record<string, unknown> | null,
  }));

  return { logs, total, page: paginaActual, pageSize: AUDIT_PAGE_SIZE };
}

export async function getUsuariosBasico(): Promise<{ id: string; nombre: string }[]> {
  return prisma.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
}
