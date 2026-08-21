import { z } from "zod";

export const ETAPAS = ["Descubrir", "Incubar", "Formar", "Fomentar", "Financiar"] as const;
export const ESTADOS_EMPRENDEDOR = ["Activo", "Graduado", "Inactivo"] as const;

export const emprendedorCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  emprendimiento: z.string().trim().min(1, "El nombre del emprendimiento es obligatorio"),
  sector: z.string().trim().min(1, "El sector es obligatorio"),
  etapa: z.enum(ETAPAS, { message: "Etapa no reconocida" }),
  estado: z.enum(ESTADOS_EMPRENDEDOR, { message: "Estado no reconocido" }),
  fechaIngreso: z.string().trim().min(1, "La fecha de ingreso es obligatoria"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio"),
});

export type EmprendedorCreateInput = z.infer<typeof emprendedorCreateSchema>;
