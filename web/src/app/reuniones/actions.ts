"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import {
  reunionCreateSchema,
  reunionReagendarSchema,
  reunionCancelarSchema,
} from "@/lib/validation/reunion";

export type ReunionActionState = { error?: string; success?: boolean };

function revalidarReuniones() {
  revalidatePath("/reuniones");
  revalidatePath("/");
}

export async function programarReunion(
  _prevState: ReunionActionState,
  formData: FormData
): Promise<ReunionActionState> {
  let session;
  try {
    // RF08: solo Administrador y Docente programan reuniones.
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = reunionCreateSchema.safeParse({
    emprendedorId: formData.get("emprendedorId"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
    observaciones: formData.get("observaciones"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: parsed.data.emprendedorId } });
  if (!emprendedor) {
    return { error: "El emprendedor seleccionado ya no existe." };
  }

  try {
    const reunion = await prisma.reunion.create({
      data: {
        emprendedorId: parsed.data.emprendedorId,
        docenteId: session.user.rol === "DOCENTE" ? session.user.id : undefined,
        fecha: new Date(`${parsed.data.fecha}T00:00:00`),
        hora: parsed.data.hora,
        estado: "Programada",
        accion: "Crear",
        observaciones: parsed.data.observaciones,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Reunion",
      entidadId: reunion.id,
      accion: "CREATE",
      valorNuevo: {
        emprendedorId: reunion.emprendedorId,
        fecha: parsed.data.fecha,
        hora: reunion.hora,
        estado: reunion.estado,
      },
    });
  } catch (error) {
    console.error("No se pudo programar la reunión", error);
    return { error: "No se pudo programar la reunión. Intenta de nuevo." };
  }

  revalidarReuniones();
  return { success: true };
}

export async function reagendarReunion(
  _prevState: ReunionActionState,
  formData: FormData
): Promise<ReunionActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = reunionReagendarSchema.safeParse({
    id: formData.get("id"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.reunion.findUnique({ where: { id: parsed.data.id } });
  if (!actual) {
    return { error: "La reunión ya no existe." };
  }

  try {
    const reunion = await prisma.reunion.update({
      where: { id: parsed.data.id },
      data: {
        fecha: new Date(`${parsed.data.fecha}T00:00:00`),
        hora: parsed.data.hora,
        estado: "Reagendada",
        accion: "Reagendar",
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Reunion",
      entidadId: reunion.id,
      accion: "UPDATE",
      valorAnterior: { fecha: actual.fecha.toISOString().slice(0, 10), hora: actual.hora, estado: actual.estado },
      valorNuevo: { fecha: parsed.data.fecha, hora: reunion.hora, estado: reunion.estado },
    });
  } catch (error) {
    console.error("No se pudo reagendar la reunión", error);
    return { error: "No se pudo reagendar la reunión. Intenta de nuevo." };
  }

  revalidarReuniones();
  return { success: true };
}

export async function cancelarReunion(
  _prevState: ReunionActionState,
  formData: FormData
): Promise<ReunionActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = reunionCancelarSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const actual = await prisma.reunion.findUnique({ where: { id: parsed.data.id } });
  if (!actual) {
    return { error: "La reunión ya no existe." };
  }

  try {
    const reunion = await prisma.reunion.update({
      where: { id: parsed.data.id },
      data: { estado: "Cancelada", accion: "Cancelar" },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Reunion",
      entidadId: reunion.id,
      accion: "UPDATE",
      valorAnterior: { estado: actual.estado },
      valorNuevo: { estado: reunion.estado },
    });
  } catch (error) {
    console.error("No se pudo cancelar la reunión", error);
    return { error: "No se pudo cancelar la reunión. Intenta de nuevo." };
  }

  revalidarReuniones();
  return { success: true };
}
