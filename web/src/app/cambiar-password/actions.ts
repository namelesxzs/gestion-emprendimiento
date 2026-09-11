"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { cambiarPasswordSchema } from "@/lib/validation/password";

export type CambiarPasswordState = { error?: string; success?: boolean };

export async function cambiarPasswordPropio(
  _prevState: CambiarPasswordState,
  formData: FormData
): Promise<CambiarPasswordState> {
  let session;
  try {
    // Cualquier rol autenticado puede cambiar su propia contraseña.
    session = await requireSession();
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = cambiarPasswordSchema.safeParse({
    nuevaPassword: formData.get("nuevaPassword"),
    confirmar: formData.get("confirmar"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.nuevaPassword, 10);
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { passwordHash, debeCambiarPassword: false },
    });

    // Nunca se audita la contraseña en claro — solo que el propio usuario
    // reemplazó la temporal por una suya.
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Usuario",
      entidadId: session.user.id,
      accion: "UPDATE",
      valorNuevo: { passwordCambiadaPorUsuario: true },
    });
  } catch (error) {
    console.error("No se pudo cambiar la contraseña", error);
    return { error: "No se pudo cambiar la contraseña. Intenta de nuevo." };
  }

  return { success: true };
}
