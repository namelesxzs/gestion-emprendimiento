"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { emprendedorCreateSchema, emprendedorUpdateSchema } from "@/lib/validation/emprendedor";

export type RegistrarEmprendedorState = { error?: string; success?: boolean };

export async function registrarEmprendedor(
  _prevState: RegistrarEmprendedorState,
  formData: FormData
): Promise<RegistrarEmprendedorState> {
  let session;
  try {
    // RF01/RF13: solo Administrador y Docente pueden registrar emprendedores.
    // Se verifica aquí (servidor), no solo ocultando el botón en la UI.
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = emprendedorCreateSchema.safeParse({
    nombre: formData.get("nombre"),
    emprendimiento: formData.get("emprendimiento"),
    sector: formData.get("sector"),
    etapa: formData.get("etapa"),
    estado: formData.get("estado") || "Activo",
    fechaIngreso: formData.get("fechaIngreso"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const yaExiste = await prisma.emprendedor.findUnique({ where: { correo: parsed.data.correo } });
  if (yaExiste) {
    return { error: "Ya existe un emprendedor registrado con ese correo." };
  }

  try {
    const emprendedor = await prisma.emprendedor.create({
      data: {
        nombre: parsed.data.nombre,
        emprendimiento: parsed.data.emprendimiento,
        sector: parsed.data.sector,
        etapa: parsed.data.etapa,
        estado: parsed.data.estado,
        fechaIngreso: new Date(`${parsed.data.fechaIngreso}T00:00:00`),
        correo: parsed.data.correo,
        telefono: parsed.data.telefono,
        responsableId: session.user.rol === "DOCENTE" ? session.user.id : undefined,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Emprendedor",
      entidadId: emprendedor.id,
      accion: "CREATE",
      valorNuevo: {
        nombre: emprendedor.nombre,
        correo: emprendedor.correo,
        emprendimiento: emprendedor.emprendimiento,
        etapa: emprendedor.etapa,
        estado: emprendedor.estado,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar el emprendedor", error);
    return { error: "No se pudo registrar el emprendedor. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  revalidatePath("/");
  return { success: true };
}

export type EditarEmprendedorState = { error?: string; success?: boolean };

export async function editarEmprendedor(
  _prevState: EditarEmprendedorState,
  formData: FormData
): Promise<EditarEmprendedorState> {
  let session;
  try {
    // RF02/RF07/RF13: solo Administrador y Docente pueden editar
    // emprendedores o actualizar su etapa. Verificado en servidor.
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = emprendedorUpdateSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    emprendimiento: formData.get("emprendimiento"),
    sector: formData.get("sector"),
    etapa: formData.get("etapa"),
    estado: formData.get("estado"),
    fechaIngreso: formData.get("fechaIngreso"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.emprendedor.findUnique({ where: { id: parsed.data.id } });
  if (!actual) {
    return { error: "El emprendedor que intentas editar ya no existe." };
  }

  const correoEnUso = await prisma.emprendedor.findFirst({
    where: { correo: parsed.data.correo, NOT: { id: parsed.data.id } },
  });
  if (correoEnUso) {
    return { error: "Ese correo ya pertenece a otro emprendedor." };
  }

  try {
    const actualizado = await prisma.emprendedor.update({
      where: { id: parsed.data.id },
      data: {
        nombre: parsed.data.nombre,
        emprendimiento: parsed.data.emprendimiento,
        sector: parsed.data.sector,
        etapa: parsed.data.etapa,
        estado: parsed.data.estado,
        fechaIngreso: new Date(`${parsed.data.fechaIngreso}T00:00:00`),
        correo: parsed.data.correo,
        telefono: parsed.data.telefono,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Emprendedor",
      entidadId: actualizado.id,
      accion: "UPDATE",
      valorAnterior: {
        nombre: actual.nombre,
        correo: actual.correo,
        emprendimiento: actual.emprendimiento,
        sector: actual.sector,
        telefono: actual.telefono,
        etapa: actual.etapa,
        estado: actual.estado,
      },
      valorNuevo: {
        nombre: actualizado.nombre,
        correo: actualizado.correo,
        emprendimiento: actualizado.emprendimiento,
        sector: actualizado.sector,
        telefono: actualizado.telefono,
        etapa: actualizado.etapa,
        estado: actualizado.estado,
      },
    });
  } catch (error) {
    console.error("No se pudo editar el emprendedor", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  revalidatePath("/");
  return { success: true };
}
