import { z } from "zod";

export const ESTADOS_DOCUMENTO = ["Pendiente", "Aprobado", "Rechazado"] as const;

export const TIPOS_MIME_PERMITIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;

export const TAMANO_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export const revisarDocumentoSchema = z
  .object({
    id: z.string().trim().min(1),
    estado: z.enum(["Aprobado", "Rechazado"], { message: "Estado no reconocido" }),
    comentario: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.estado !== "Rechazado" || !!data.comentario, {
    message: "Debes indicar qué corregir al rechazar un documento",
    path: ["comentario"],
  });

export type RevisarDocumentoInput = z.infer<typeof revisarDocumentoSchema>;
