"use server";

import { prisma } from "@/lib/prisma";
import { solicitarRestablecimientoSchema } from "@/lib/validation/password";

export type SolicitarRestablecimientoState = { error?: string; success?: boolean };

export async function solicitarRestablecimiento(
  _prevState: SolicitarRestablecimientoState,
  formData: FormData
): Promise<SolicitarRestablecimientoState> {
  const parsed = solicitarRestablecimientoSchema.safeParse({
    correo: formData.get("correo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }

  // Ruta pública, sin sesión — nunca se revela si el correo existe o no,
  // ni si ya hay una solicitud pendiente: siempre se responde success.
  const usuario = await prisma.usuario.findUnique({ where: { correo: parsed.data.correo } });
  if (usuario && usuario.activo) {
    const yaPendiente = await prisma.solicitudRestablecimiento.findFirst({
      where: { usuarioId: usuario.id, estado: "Pendiente" },
    });
    if (!yaPendiente) {
      await prisma.solicitudRestablecimiento.create({
        data: { usuarioId: usuario.id, correo: usuario.correo },
      });
    }
  }

  return { success: true };
}
