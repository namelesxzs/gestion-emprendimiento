import { z } from "zod";
import { ETAPAS } from "./emprendedor";

export const acompanamientoCreateSchema = z.object({
  emprendedorId: z.string().trim().min(1),
  etapa: z.enum(ETAPAS, { message: "Etapa no reconocida" }),
  diagnostico: z.string().trim().min(1, "El diagnóstico es obligatorio"),
  recomendaciones: z.string().trim().min(1, "Las recomendaciones son obligatorias"),
  avancePct: z.coerce.number().int().min(0, "El avance no puede ser negativo").max(100, "El avance no puede superar 100"),
  compromisoDescripcion: z.string().trim().min(1, "El compromiso es obligatorio"),
  compromisoFecha: z.string().trim().min(1, "La fecha del compromiso es obligatoria"),
});

export type AcompanamientoCreateInput = z.infer<typeof acompanamientoCreateSchema>;
