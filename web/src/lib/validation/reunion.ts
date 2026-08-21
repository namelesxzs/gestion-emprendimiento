import { z } from "zod";

export const reunionCreateSchema = z.object({
  emprendedorId: z.string().trim().min(1, "Selecciona un emprendedor"),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  hora: z.string().trim().min(1, "La hora es obligatoria"),
  observaciones: z.string().trim().min(1, "Las observaciones son obligatorias"),
});

export const reunionReagendarSchema = z.object({
  id: z.string().trim().min(1),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  hora: z.string().trim().min(1, "La hora es obligatoria"),
});

export const reunionCancelarSchema = z.object({
  id: z.string().trim().min(1),
});
