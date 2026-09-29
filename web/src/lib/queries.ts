import { prisma } from "@/lib/prisma";
import type {
  Acompanamiento,
  Cohorte,
  Compromiso,
  Documento,
  Emprendedor,
  Etapa,
  EstadoCompromiso,
  EstadoDocumento,
  EstadoEmprendedor,
  EstadoReunion,
  IntegranteEquipo,
  Reunion,
  UsuarioGestionable,
} from "@/lib/types";
import type { CampoRuntime } from "@/lib/validation/catalogo";

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getEmprendedores(soloEmprendedorId?: string): Promise<Emprendedor[]> {
  const rows = await prisma.emprendedor.findMany({
    where: soloEmprendedorId ? { id: soloEmprendedorId } : undefined,
    include: { responsable: true, fase: { select: { nombre: true } }, cohorte: { select: { nombre: true } } },
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
    faseId: e.faseId,
    faseNombre: e.fase?.nombre ?? null,
    sede: e.sede,
    programaAcademico: e.programaAcademico,
    facultad: e.facultad,
    tipoInnovacion: e.tipoInnovacion,
    madurez: e.madurez,
    problema: e.problema,
    descripcionIdea: e.descripcionIdea,
    canalPostulacion: e.canalPostulacion,
    cohorteId: e.cohorteId,
    cohorteNombre: e.cohorte?.nombre ?? null,
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

export async function getDocumentosByEmprendedor(soloEmprendedorId?: string): Promise<Documento[]> {
  const rows = await prisma.documento.findMany({
    where: soloEmprendedorId ? { emprendedorId: soloEmprendedorId } : undefined,
    include: { subidoPor: { select: { nombre: true } }, revisadoPor: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((d) => ({
    id: d.id,
    emprendedorId: d.emprendedorId,
    etapa: d.etapa as Etapa,
    nombreArchivo: d.nombreArchivo,
    mimeType: d.mimeType,
    tamanoBytes: d.tamanoBytes,
    subidoPor: d.subidoPor.nombre,
    estado: d.estado as EstadoDocumento,
    comentarioRevision: d.comentarioRevision,
    revisadoPor: d.revisadoPor?.nombre ?? null,
    revisadoEn: d.revisadoEn ? d.revisadoEn.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : null,
    createdAt: d.createdAt.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }),
  }));
}

export async function getUsuarios(): Promise<UsuarioGestionable[]> {
  const rows = await prisma.usuario.findMany({
    where: { rol: { in: ["ADMINISTRADOR", "DOCENTE", "COORDINADOR"] } },
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  });

  return rows.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol as UsuarioGestionable["rol"],
    sede: u.sede,
    activo: u.activo,
  }));
}

export interface SolicitudRestablecimientoRow {
  id: string;
  correo: string;
  usuarioNombre: string;
  usuarioRol: string;
  createdAt: string;
}

export async function getSolicitudesRestablecimiento(): Promise<SolicitudRestablecimientoRow[]> {
  const rows = await prisma.solicitudRestablecimiento.findMany({
    where: { estado: "Pendiente" },
    include: { usuario: { select: { nombre: true, rol: true } } },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((s) => ({
    id: s.id,
    correo: s.correo,
    usuarioNombre: s.usuario.nombre,
    usuarioRol: s.usuario.rol,
    createdAt: s.createdAt.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }),
  }));
}

export async function getEmprendedorIdsConPortal(): Promise<Set<string>> {
  const rows = await prisma.usuario.findMany({
    where: { rol: "EMPRENDEDOR", emprendedorId: { not: null } },
    select: { emprendedorId: true },
  });
  return new Set(rows.map((r) => r.emprendedorId as string));
}

export interface EmprendedoresPorSede {
  sede: string;
  total: number;
  activos: number;
}

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


export interface FaseRow {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activa: boolean;
}

export async function getFases(soloActivas = false): Promise<FaseRow[]> {
  const rows = await prisma.fase.findMany({
    where: soloActivas ? { activa: true } : undefined,
    orderBy: { orden: "asc" },
  });
  return rows.map((f) => ({
    id: f.id,
    clave: f.clave,
    nombre: f.nombre,
    descripcion: f.descripcion,
    orden: f.orden,
    activa: f.activa,
  }));
}

export interface EtapaRow {
  id: string;
  clave: string;
  nombre: string;
  color: string | null;
  orden: number;
  activa: boolean;
  faseId: string | null;
  faseNombre: string | null;
}

export async function getEtapasCatalogo(soloActivas = false): Promise<EtapaRow[]> {
  const rows = await prisma.etapa.findMany({
    where: soloActivas ? { activa: true } : undefined,
    include: { fase: { select: { nombre: true } } },
    orderBy: { orden: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    clave: e.clave,
    nombre: e.nombre,
    color: e.color,
    orden: e.orden,
    activa: e.activa,
    faseId: e.faseId,
    faseNombre: e.fase?.nombre ?? null,
  }));
}

export interface InstrumentoRow {
  id: string;
  clave: string;
  nombre: string;
  proposito: string;
  origenManual: string | null;
  momento: string | null;
  responsableDiligencia: string | null;
  responsableRevisa: string | null;
  orden: number;
  activo: boolean;
  faseId: string | null;
  faseNombre: string | null;
  camposSchema: CampoRuntime[];
  permiteMultiples: boolean;
  transversal: boolean;
  plazoRevisionDias: number | null;
}

export async function getInstrumentos(soloActivos = false): Promise<InstrumentoRow[]> {
  const rows = await prisma.instrumento.findMany({
    where: soloActivos ? { activo: true } : undefined,
    include: { fase: { select: { nombre: true } } },
    orderBy: { orden: "asc" },
  });
  return rows.map((i) => ({
    id: i.id,
    clave: i.clave,
    nombre: i.nombre,
    proposito: i.proposito,
    origenManual: i.origenManual,
    momento: i.momento,
    responsableDiligencia: i.responsableDiligencia,
    responsableRevisa: i.responsableRevisa,
    orden: i.orden,
    activo: i.activo,
    faseId: i.faseId,
    faseNombre: i.fase?.nombre ?? null,
    camposSchema: (i.camposSchema as unknown as CampoRuntime[]) ?? [],
    permiteMultiples: i.permiteMultiples,
    transversal: i.transversal,
    plazoRevisionDias: i.plazoRevisionDias,
  }));
}

export async function getInstrumentoById(id: string): Promise<InstrumentoRow | null> {
  const todos = await getInstrumentos();
  return todos.find((i) => i.id === id) ?? null;
}

export interface ReglaAvanceRow {
  id: string;
  nombre: string;
  faseOrigenId: string | null;
  faseOrigenNombre: string | null;
  faseDestinoId: string;
  faseDestinoNombre: string;
  instrumentosClaves: string[];
  activa: boolean;
}

export async function getReglasAvance(): Promise<ReglaAvanceRow[]> {
  const rows = await prisma.reglaAvance.findMany({
    include: { faseOrigen: { select: { nombre: true } }, faseDestino: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    faseOrigenId: r.faseOrigenId,
    faseOrigenNombre: r.faseOrigen?.nombre ?? null,
    faseDestinoId: r.faseDestinoId,
    faseDestinoNombre: r.faseDestino.nombre,
    instrumentosClaves: (r.instrumentosClaves as unknown as string[]) ?? [],
    activa: r.activa,
  }));
}

export interface RespuestaInstrumentoRow {
  id: string;
  instrumentoId: string;
  datos: Record<string, unknown>;
  registradoPorNombre: string;
  createdAt: string;
  updatedAt: string;
  estadoRevision: "Pendiente" | "Revisado" | "Devuelto";
  revisadoPorNombre: string | null;
  revisadoEn: string | null;
  comentarioRevision: string | null;
  revisionVencida: boolean;
}

export interface RespuestaInstrumentoRowConEmprendedor extends RespuestaInstrumentoRow {
  emprendedorId: string;
}

export async function getRespuestasInstrumento(
  soloEmprendedorId?: string
): Promise<RespuestaInstrumentoRowConEmprendedor[]> {
  const rows = await prisma.instrumentoRespuesta.findMany({
    where: soloEmprendedorId ? { emprendedorId: soloEmprendedorId } : undefined,
    include: {
      registradoPor: { select: { nombre: true } },
      revisadoPor: { select: { nombre: true } },
      instrumento: { select: { plazoRevisionDias: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const ahora = Date.now();
  const fmt = (d: Date) => d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
  return rows.map((r) => {
    const plazo = r.instrumento.plazoRevisionDias;
    return {
      id: r.id,
      instrumentoId: r.instrumentoId,
      emprendedorId: r.emprendedorId,
      datos: r.datos as Record<string, unknown>,
      registradoPorNombre: r.registradoPor.nombre,
      createdAt: fmt(r.createdAt),
      updatedAt: fmt(r.updatedAt),
      estadoRevision: r.estadoRevision as RespuestaInstrumentoRow["estadoRevision"],
      revisadoPorNombre: r.revisadoPor?.nombre ?? null,
      revisadoEn: r.revisadoEn ? fmt(r.revisadoEn) : null,
      comentarioRevision: r.comentarioRevision,
      revisionVencida:
        r.estadoRevision === "Pendiente" && plazo !== null && ahora > r.updatedAt.getTime() + plazo * 86_400_000,
    };
  });
}


export async function getCohortes(soloActivas = false): Promise<Cohorte[]> {
  const rows = await prisma.cohorte.findMany({
    where: soloActivas ? { activa: true } : undefined,
    orderBy: [{ activa: "desc" }, { nombre: "asc" }],
  });
  return rows.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    sede: c.sede,
    fechaInicio: c.fechaInicio ? fmtDate(c.fechaInicio) : null,
    fechaFin: c.fechaFin ? fmtDate(c.fechaFin) : null,
    activa: c.activa,
  }));
}

export interface EmprendedoresPorCohorte {
  cohorte: string;
  total: number;
  activos: number;
}

export async function getEmprendedoresPorCohorte(): Promise<EmprendedoresPorCohorte[]> {
  const rows = await prisma.emprendedor.findMany({
    select: { estado: true, cohorte: { select: { nombre: true } } },
  });

  const mapa = new Map<string, EmprendedoresPorCohorte>();
  for (const r of rows) {
    const cohorte = r.cohorte?.nombre ?? "Sin cohorte asignada";
    const actual = mapa.get(cohorte) ?? { cohorte, total: 0, activos: 0 };
    actual.total += 1;
    if (r.estado === "Activo") actual.activos += 1;
    mapa.set(cohorte, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

export async function getIntegrantesEquipo(soloEmprendedorId?: string): Promise<IntegranteEquipo[]> {
  const rows = await prisma.integranteEquipo.findMany({
    where: soloEmprendedorId ? { emprendedorId: soloEmprendedorId } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return rows.map((i) => ({
    id: i.id,
    emprendedorId: i.emprendedorId,
    nombre: i.nombre,
    documento: i.documento,
    programaAcademico: i.programaAcademico,
    semestre: i.semestre,
    correo: i.correo,
    telefono: i.telefono,
    rolEquipo: i.rolEquipo,
  }));
}
