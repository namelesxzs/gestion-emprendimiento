import { z } from "zod";

export const cambiarPasswordSchema = z
  .object({
    nuevaPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((data) => data.nuevaPassword === data.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;

export const solicitarRestablecimientoSchema = z.object({
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
});
