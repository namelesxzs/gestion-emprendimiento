"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { acompanamientoCreateSchema } from "@/lib/validation/acompanamiento";

export type RegistrarAcompanamientoState = { error?: string; success?: boolean };

export async function registrarAcompanamiento(
  _prevState: RegistrarAcompanamientoState,
  formData: FormData
): Promise<RegistrarAcompanamientoState> {
  let session;
  try {
    // RF03-06: solo Administrador y Docente registran acompañamientos.
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = acompanamientoCreateSchema.safeParse({
    emprendedorId: formData.get("emprendedorId"),
    etapa: formData.get("etapa"),
    diagnostico: formData.get("diagnostico"),
    recomendaciones: formData.get("recomendaciones"),
    avancePct: formData.get("avancePct"),
    compromisoDescripcion: formData.get("compromisoDescripcion"),
    compromisoFecha: formData.get("compromisoFecha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: parsed.data.emprendedorId } });
  if (!emprendedor) {
    return { error: "El emprendedor seleccionado ya no existe." };
  }

  try {
    const acompanamiento = await prisma.acompanamiento.create({
      data: {
        emprendedorId: parsed.data.emprendedorId,
        docenteId: session.user.rol === "DOCENTE" ? session.user.id : undefined,
        fecha: new Date(),
        etapa: parsed.data.etapa,
        diagnostico: parsed.data.diagnostico,
        recomendaciones: parsed.data.recomendaciones,
        avancePct: parsed.data.avancePct,
        compromisos: {
          create: {
            descripcion: parsed.data.compromisoDescripcion,
            fechaCompromiso: new Date(`${parsed.data.compromisoFecha}T00:00:00`),
            estado: "Pendiente",
          },
        },
      },
    });

    // Si el acompañamiento avanza la etapa del emprendedor, se refleja
    // también en su ficha (RF07 — actualizar etapa de la cadena de valor).
    if (parsed.data.etapa !== emprendedor.etapa) {
      await prisma.emprendedor.update({
        where: { id: emprendedor.id },
        data: { etapa: parsed.data.etapa },
      });
    }

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Acompanamiento",
      entidadId: acompanamiento.id,
      accion: "CREATE",
      valorNuevo: {
        emprendedorId: acompanamiento.emprendedorId,
        etapa: acompanamiento.etapa,
        diagnostico: acompanamiento.diagnostico,
        avancePct: acompanamiento.avancePct,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar el acompañamiento", error);
    return { error: "No se pudo registrar el acompañamiento. Intenta de nuevo." };
  }

  revalidatePath("/acompanamientos");
  revalidatePath("/emprendedores");
  revalidatePath("/");
  return { success: true };
}
