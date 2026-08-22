"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { docenteCreateSchema } from "@/lib/validation/usuario";

export type RegistrarDocenteState = { error?: string; success?: boolean };

export async function registrarDocente(
  _prevState: RegistrarDocenteState,
  formData: FormData
): Promise<RegistrarDocenteState> {
  let session;
  try {
    // Solo Administrador da de alta cuentas de Docente.
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = docenteCreateSchema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    password: formData.get("password"),
    sede: formData.get("sede"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const yaExiste = await prisma.usuario.findUnique({ where: { correo: parsed.data.correo } });
  if (yaExiste) {
    return { error: "Ya existe un usuario registrado con ese correo." };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const docente = await prisma.usuario.create({
      data: {
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        passwordHash,
        rol: "DOCENTE",
        sede: parsed.data.sede,
      },
    });

    // Nunca se audita el hash ni la contraseña en claro.
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: docente.id,
      accion: "CREATE",
      valorNuevo: {
        nombre: docente.nombre,
        correo: docente.correo,
        rol: docente.rol,
        sede: docente.sede,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar el docente", error);
    return { error: "No se pudo registrar el docente. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  return { success: true };
}
