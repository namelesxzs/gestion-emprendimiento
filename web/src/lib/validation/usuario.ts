import { z } from "zod";

// Sedes activas de la Fundación Universitaria María Cano. Lista abierta a
// crecer (hay planes institucionales de sumar sedes) — es un array simple,
// no un enum de base de datos, para que agregar una sea un cambio de una
// línea aquí, igual que ETAPAS/ESTADOS_EMPRENDEDOR.
export const SEDES = ["Medellín", "Neiva", "Popayán"] as const;

// Roles que se administran desde /usuarios. EMPRENDEDOR queda fuera a
// propósito: esa cuenta siempre nace vinculada a un registro de Emprendedor
// puntual (botón "Dar acceso al portal" en /emprendedores), no tiene sentido
// darla de alta desde un formulario genérico de "nuevo usuario".
export const ROLES_GESTIONABLES = ["ADMINISTRADOR", "DOCENTE", "COORDINADOR"] as const;

const camposBase = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  rol: z.enum(ROLES_GESTIONABLES, { message: "Rol no reconocido" }),
  // Solo obligatoria cuando rol = DOCENTE (ver refine abajo); "" para los
  // demás roles, tal como ya se guarda en Usuario.sede (nullable).
  sede: z.string().trim().optional(),
};

function exigirSedeParaDocente<T extends { rol: string; sede?: string }>(data: T, ctx: z.RefinementCtx) {
  if (data.rol === "DOCENTE" && !SEDES.includes(data.sede as (typeof SEDES)[number])) {
    ctx.addIssue({ code: "custom", path: ["sede"], message: "La sede es obligatoria para el rol Docente" });
  }
}

export const usuarioCreateSchema = z
  .object({
    ...camposBase,
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .superRefine(exigirSedeParaDocente);

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;

export const usuarioUpdateSchema = z
  .object({
    id: z.string().trim().min(1),
    ...camposBase,
  })
  .superRefine(exigirSedeParaDocente);

export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
