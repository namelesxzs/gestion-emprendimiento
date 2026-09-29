import { z } from "zod";
import { SEDES } from "./usuario";

export const ETAPAS = ["Descubrir", "Incubar", "Formar", "Fomentar", "Financiar"] as const;
export const ESTADOS_EMPRENDEDOR = ["Activo", "Graduado", "Inactivo"] as const;

export const TIPOS_INNOVACION = ["Base tecnológica", "Social", "Tradicional"] as const;
export const NIVELES_MADUREZ = ["Idea", "Prototipo", "Operando"] as const;
export const CANALES_POSTULACION = ["Formulario web", "Feria", "Referido", "Otro"] as const;

export const emprendedorCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  emprendimiento: z.string().trim().min(1, "El nombre del emprendimiento es obligatorio"),
  sector: z.string().trim().min(1, "El sector es obligatorio"),
  etapa: z.enum(ETAPAS, { message: "Etapa no reconocida" }),
  estado: z.enum(ESTADOS_EMPRENDEDOR, { message: "Estado no reconocido" }),
  fechaIngreso: z.string().trim().min(1, "La fecha de ingreso es obligatoria"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio"),
  faseId: z.string().trim().optional(),
  cohorteId: z.string().trim().optional(),
  sede: z.union([z.enum(SEDES), z.literal("")]).optional(),
  programaAcademico: z.string().trim().optional(),
  facultad: z.string().trim().optional(),
  tipoInnovacion: z.union([z.enum(TIPOS_INNOVACION), z.literal("")]).optional(),
  madurez: z.union([z.enum(NIVELES_MADUREZ), z.literal("")]).optional(),
  problema: z.string().trim().optional(),
  descripcionIdea: z.string().trim().optional(),
  canalPostulacion: z.union([z.enum(CANALES_POSTULACION), z.literal("")]).optional(),
});

export type EmprendedorCreateInput = z.infer<typeof emprendedorCreateSchema>;

export const emprendedorUpdateSchema = emprendedorCreateSchema.extend({
  id: z.string().trim().min(1),
});

export type EmprendedorUpdateInput = z.infer<typeof emprendedorUpdateSchema>;

export const integranteEquipoSchema = z.object({
  emprendedorId: z.string().trim().min(1),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  documento: z.string().trim().optional(),
  programaAcademico: z.string().trim().optional(),
  semestre: z.string().trim().optional(),
  correo: z.string().trim().toLowerCase().optional(),
  telefono: z.string().trim().optional(),
  rolEquipo: z.string().trim().optional(),
});

export type IntegranteEquipoInput = z.infer<typeof integranteEquipoSchema>;

export const cohorteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  sede: z.union([z.enum(SEDES), z.literal("")]).optional(),
  fechaInicio: z.string().trim().optional(),
  fechaFin: z.string().trim().optional(),
});

export type CohorteInput = z.infer<typeof cohorteSchema>;

export const editarCohorteSchema = cohorteSchema.extend({
  id: z.string().trim().min(1),
});

export const toggleCohorteSchema = z.object({
  id: z.string().trim().min(1),
});
