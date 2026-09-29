export type Etapa = "Descubrir" | "Incubar" | "Formar" | "Fomentar" | "Financiar";

export type EstadoEmprendedor = "Activo" | "Graduado" | "Inactivo";

export type EstadoCompromiso = "Pendiente" | "En proceso" | "Cumplido";

export type EstadoReunion = "Programada" | "Reagendada" | "Cancelada" | "Realizada";

export type EstadoDocumento = "Pendiente" | "Aprobado" | "Rechazado";

export interface Emprendedor {
  id: string;
  nombre: string;
  emprendimiento: string;
  sector: string;
  etapa: Etapa;
  estado: EstadoEmprendedor;
  fechaIngreso: string;
  responsable: string;
  correo: string;
  telefono: string;
  faseId: string | null;
  faseNombre: string | null;
  sede: string | null;
  programaAcademico: string | null;
  facultad: string | null;
  tipoInnovacion: string | null;
  madurez: string | null;
  problema: string | null;
  descripcionIdea: string | null;
  canalPostulacion: string | null;
  cohorteId: string | null;
  cohorteNombre: string | null;
}

export interface IntegranteEquipo {
  id: string;
  emprendedorId: string;
  nombre: string;
  documento: string | null;
  programaAcademico: string | null;
  semestre: string | null;
  correo: string | null;
  telefono: string | null;
  rolEquipo: string | null;
}

export interface Cohorte {
  id: string;
  nombre: string;
  sede: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  activa: boolean;
}

export interface Acompanamiento {
  id: string;
  emprendedorId: string;
  fecha: string;
  etapa: Etapa;
  diagnostico: string;
  recomendaciones: string;
  compromisos: string;
  avancePct: number;
  estado: EstadoCompromiso;
}

export interface Reunion {
  id: string;
  emprendedorId: string;
  fecha: string;
  hora: string;
  estado: EstadoReunion;
  accion: string;
  observaciones: string;
}

export interface Documento {
  id: string;
  emprendedorId: string;
  etapa: Etapa;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  subidoPor: string;
  estado: EstadoDocumento;
  comentarioRevision: string | null;
  revisadoPor: string | null;
  revisadoEn: string | null;
  createdAt: string;
}

export interface Compromiso {
  id: string;
  acompanamientoId: string;
  descripcion: string;
  fechaCompromiso: string;
  fechaCumplimiento: string | null;
  estado: EstadoCompromiso;
}

export interface UsuarioGestionable {
  id: string;
  nombre: string;
  correo: string;
  rol: "ADMINISTRADOR" | "DOCENTE" | "COORDINADOR";
  sede: string | null;
  activo: boolean;
}
