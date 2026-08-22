export type Etapa = "Descubrir" | "Incubar" | "Formar" | "Fomentar" | "Financiar";

export type EstadoEmprendedor = "Activo" | "Graduado" | "Inactivo";

export type EstadoCompromiso = "Pendiente" | "En proceso" | "Cumplido";

export type EstadoReunion = "Programada" | "Reagendada" | "Cancelada" | "Realizada";

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
}

/**
 * Vista aplanada de un Acompanamiento para las pantallas actuales. En la
 * base de datos los compromisos viven en su propia tabla (uno o varios por
 * acompañamiento, ver prisma/schema.prisma); `compromisos`/`estado` aquí
 * resumen esa relación para no tocar los componentes de UI existentes.
 */
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

export interface Compromiso {
  id: string;
  acompanamientoId: string;
  descripcion: string;
  fechaCompromiso: string;
  fechaCumplimiento: string | null;
  estado: EstadoCompromiso;
}

/** Usuario de personal UIE (Administrador/Docente/Coordinador) tal como se
 * lista y gestiona en /usuarios. Las cuentas EMPRENDEDOR no pasan por este
 * tipo — viven atadas a un registro de Emprendedor, ver otorgarAccesoPortal. */
export interface UsuarioGestionable {
  id: string;
  nombre: string;
  correo: string;
  rol: "ADMINISTRADOR" | "DOCENTE" | "COORDINADOR";
  sede: string | null;
  activo: boolean;
}
