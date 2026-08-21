export type Etapa = "Descubrir" | "Incubar" | "Formar" | "Fomentar" | "Financiar";

export type EstadoEmprendedor = "Activo" | "Graduado" | "Inactivo";

export type EstadoCompromiso = "Pendiente" | "En proceso" | "Cumplido";

export type EstadoReunion = "Programada" | "Reagendada" | "Cancelada" | "Realizada";

export interface Emprendedor {
  id: number;
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

export interface Acompanamiento {
  id: number;
  emprendedorId: number;
  fecha: string;
  etapa: Etapa;
  diagnostico: string;
  recomendaciones: string;
  compromisos: string;
  avancePct: number;
  estado: EstadoCompromiso;
}

export interface Reunion {
  id: number;
  emprendedorId: number;
  fecha: string;
  hora: string;
  estado: EstadoReunion;
  accion: string;
  observaciones: string;
}
