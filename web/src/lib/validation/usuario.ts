import { z } from "zod";

// Sedes activas de la Fundación Universitaria María Cano. Lista abierta a
// crecer (hay planes institucionales de sumar sedes) — es un array simple,
// no un enum de base de datos, para que agregar una sea un cambio de una
// línea aquí, igual que ETAPAS/ESTADOS_EMPRENDEDOR.
export const SEDES = ["Medellín", "Neiva", "Popayán"] as const;

export const docenteCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  sede: z.enum(SEDES, { message: "Sede no reconocida" }),
});

export type DocenteCreateInput = z.infer<typeof docenteCreateSchema>;
