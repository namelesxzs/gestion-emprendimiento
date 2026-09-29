"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { emprendedorCreateSchema, emprendedorUpdateSchema, integranteEquipoSchema } from "@/lib/validation/emprendedor";
import { ETAPA_ORDER } from "@/lib/view";
import type { Etapa } from "@/lib/types";
import { verificarReglaAvance } from "@/lib/reglasAvance";

export type RegistrarEmprendedorState = { error?: string; success?: boolean };

export async function registrarEmprendedor(
  _prevState: RegistrarEmprendedorState,
  formData: FormData
): Promise<RegistrarEmprendedorState> {
  let session;
  try {
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
    faseId: formData.get("faseId") || undefined,
    cohorteId: formData.get("cohorteId") || undefined,
    sede: formData.get("sede") || undefined,
    programaAcademico: formData.get("programaAcademico") || undefined,
    facultad: formData.get("facultad") || undefined,
    tipoInnovacion: formData.get("tipoInnovacion") || undefined,
    madurez: formData.get("madurez") || undefined,
    problema: formData.get("problema") || undefined,
    descripcionIdea: formData.get("descripcionIdea") || undefined,
    canalPostulacion: formData.get("canalPostulacion") || undefined,
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
        faseId: parsed.data.faseId || null,
        cohorteId: parsed.data.cohorteId || null,
        sede: parsed.data.sede || null,
        programaAcademico: parsed.data.programaAcademico || null,
        facultad: parsed.data.facultad || null,
        tipoInnovacion: parsed.data.tipoInnovacion || null,
        madurez: parsed.data.madurez || null,
        problema: parsed.data.problema || null,
        descripcionIdea: parsed.data.descripcionIdea || null,
        canalPostulacion: parsed.data.canalPostulacion || null,
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
    faseId: formData.get("faseId") || undefined,
    cohorteId: formData.get("cohorteId") || undefined,
    sede: formData.get("sede") || undefined,
    programaAcademico: formData.get("programaAcademico") || undefined,
    facultad: formData.get("facultad") || undefined,
    tipoInnovacion: formData.get("tipoInnovacion") || undefined,
    madurez: formData.get("madurez") || undefined,
    problema: formData.get("problema") || undefined,
    descripcionIdea: formData.get("descripcionIdea") || undefined,
    canalPostulacion: formData.get("canalPostulacion") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.emprendedor.findUnique({ where: { id: parsed.data.id } });
  if (!actual) {
    return { error: "El emprendedor que intentas editar ya no existe." };
  }

  const nuevaFaseId = parsed.data.faseId || null;
  if (nuevaFaseId && nuevaFaseId !== actual.faseId) {
    const verificacion = await verificarReglaAvance(actual.id, actual.faseId, nuevaFaseId);
    if (!verificacion.ok) return { error: verificacion.error };
  }

  const correoEnUso = await prisma.emprendedor.findFirst({
    where: { correo: parsed.data.correo, NOT: { id: parsed.data.id } },
  });
  if (correoEnUso) {
    return { error: "Ese correo ya pertenece a otro emprendedor." };
  }

  const avanzaEtapa =
    ETAPA_ORDER.indexOf(parsed.data.etapa as Etapa) > ETAPA_ORDER.indexOf(actual.etapa as Etapa);
  if (avanzaEtapa) {
    const documentoAprobado = await prisma.documento.findFirst({
      where: { emprendedorId: actual.id, etapa: actual.etapa, estado: "Aprobado" },
    });
    if (!documentoAprobado) {
      return {
        error: `Debes tener un documento aprobado de la etapa "${actual.etapa}" antes de avanzar de etapa.`,
      };
    }
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
        faseId: nuevaFaseId,
        cohorteId: parsed.data.cohorteId || null,
        sede: parsed.data.sede || null,
        programaAcademico: parsed.data.programaAcademico || null,
        facultad: parsed.data.facultad || null,
        tipoInnovacion: parsed.data.tipoInnovacion || null,
        madurez: parsed.data.madurez || null,
        problema: parsed.data.problema || null,
        descripcionIdea: parsed.data.descripcionIdea || null,
        canalPostulacion: parsed.data.canalPostulacion || null,
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
        faseId: actual.faseId,
      },
      valorNuevo: {
        nombre: actualizado.nombre,
        correo: actualizado.correo,
        emprendimiento: actualizado.emprendimiento,
        sector: actualizado.sector,
        telefono: actualizado.telefono,
        etapa: actualizado.etapa,
        estado: actualizado.estado,
        faseId: actualizado.faseId,
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

export type IntegranteEquipoState = { error?: string; success?: boolean };

export async function agregarIntegranteEquipo(
  _prevState: IntegranteEquipoState,
  formData: FormData
): Promise<IntegranteEquipoState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = integranteEquipoSchema.safeParse({
    emprendedorId: formData.get("emprendedorId"),
    nombre: formData.get("nombre"),
    documento: formData.get("documento") || undefined,
    programaAcademico: formData.get("programaAcademico") || undefined,
    semestre: formData.get("semestre") || undefined,
    correo: formData.get("correo") || undefined,
    telefono: formData.get("telefono") || undefined,
    rolEquipo: formData.get("rolEquipo") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: parsed.data.emprendedorId } });
  if (!emprendedor) return { error: "El emprendedor ya no existe." };

  try {
    const integrante = await prisma.integranteEquipo.create({
      data: {
        emprendedorId: parsed.data.emprendedorId,
        nombre: parsed.data.nombre,
        documento: parsed.data.documento || null,
        programaAcademico: parsed.data.programaAcademico || null,
        semestre: parsed.data.semestre || null,
        correo: parsed.data.correo || null,
        telefono: parsed.data.telefono || null,
        rolEquipo: parsed.data.rolEquipo || null,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "IntegranteEquipo",
      entidadId: integrante.id,
      accion: "CREATE",
      valorNuevo: { emprendedorId: integrante.emprendedorId, nombre: integrante.nombre },
    });
  } catch (error) {
    console.error("No se pudo agregar el integrante del equipo", error);
    return { error: "No se pudo agregar el integrante. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  return { success: true };
}

export async function eliminarIntegranteEquipo(
  _prevState: IntegranteEquipoState,
  formData: FormData
): Promise<IntegranteEquipoState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Integrante inválido." };

  const actual = await prisma.integranteEquipo.findUnique({ where: { id } });
  if (!actual) return { error: "El integrante ya no existe." };

  try {
    await prisma.integranteEquipo.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "IntegranteEquipo",
      entidadId: id,
      accion: "DELETE",
      valorAnterior: { emprendedorId: actual.emprendedorId, nombre: actual.nombre },
    });
  } catch (error) {
    console.error("No se pudo eliminar el integrante del equipo", error);
    return { error: "No se pudo eliminar el integrante. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  return { success: true };
}
