"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import {
  editarFaseSchema,
  editarEtapaSchema,
  editarInstrumentoSchema,
  toggleCatalogoSchema,
  crearReglaAvanceSchema,
} from "@/lib/validation/catalogo";
import { cohorteSchema, editarCohorteSchema, toggleCohorteSchema } from "@/lib/validation/emprendedor";

export type CatalogoActionState = { error?: string; success?: boolean };
const initialOk: CatalogoActionState = { success: true };

function revalidarConfiguracion() {
  revalidatePath("/configuracion");
  revalidatePath("/ruta");
}


export async function editarFase(_prevState: CatalogoActionState, formData: FormData): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = editarFaseSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") || undefined,
    orden: formData.get("orden"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const actual = await prisma.fase.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La fase ya no existe." };

  try {
    const actualizada = await prisma.fase.update({
      where: { id: parsed.data.id },
      data: { nombre: parsed.data.nombre, descripcion: parsed.data.descripcion ?? null, orden: parsed.data.orden },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Fase",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { nombre: actual.nombre, orden: actual.orden },
      valorNuevo: { nombre: actualizada.nombre, orden: actualizada.orden },
    });
  } catch (error) {
    console.error("No se pudo editar la fase", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}

export async function toggleActivaFase(_prevState: CatalogoActionState, formData: FormData): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = toggleCatalogoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Fase inválida." };

  const actual = await prisma.fase.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La fase ya no existe." };

  try {
    const actualizada = await prisma.fase.update({ where: { id: actual.id }, data: { activa: !actual.activa } });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Fase",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { activa: actual.activa },
      valorNuevo: { activa: actualizada.activa },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado de la fase", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}


export async function editarEtapa(_prevState: CatalogoActionState, formData: FormData): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = editarEtapaSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    orden: formData.get("orden"),
    faseId: formData.get("faseId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const actual = await prisma.etapa.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La etapa ya no existe." };

  try {
    const actualizada = await prisma.etapa.update({
      where: { id: parsed.data.id },
      data: { nombre: parsed.data.nombre, orden: parsed.data.orden, faseId: parsed.data.faseId || null },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Etapa",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { nombre: actual.nombre, orden: actual.orden, faseId: actual.faseId },
      valorNuevo: { nombre: actualizada.nombre, orden: actualizada.orden, faseId: actualizada.faseId },
    });
  } catch (error) {
    console.error("No se pudo editar la etapa", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}

export async function toggleActivaEtapa(_prevState: CatalogoActionState, formData: FormData): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = toggleCatalogoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Etapa inválida." };

  const actual = await prisma.etapa.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La etapa ya no existe." };

  try {
    const actualizada = await prisma.etapa.update({ where: { id: actual.id }, data: { activa: !actual.activa } });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Etapa",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { activa: actual.activa },
      valorNuevo: { activa: actualizada.activa },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado de la etapa", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}


export async function editarInstrumento(
  _prevState: CatalogoActionState,
  formData: FormData
): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = editarInstrumentoSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    proposito: formData.get("proposito"),
    momento: formData.get("momento") || undefined,
    responsableDiligencia: formData.get("responsableDiligencia") || undefined,
    responsableRevisa: formData.get("responsableRevisa") || undefined,
    faseId: formData.get("faseId") || undefined,
    orden: formData.get("orden"),
    plazoRevisionDias: formData.get("plazoRevisionDias") || undefined,
    permiteMultiples: formData.get("permiteMultiples") === "on",
    transversal: formData.get("transversal") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const actual = await prisma.instrumento.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "El instrumento ya no existe." };

  try {
    const actualizado = await prisma.instrumento.update({
      where: { id: parsed.data.id },
      data: {
        nombre: parsed.data.nombre,
        proposito: parsed.data.proposito,
        momento: parsed.data.momento ?? null,
        responsableDiligencia: parsed.data.responsableDiligencia ?? null,
        responsableRevisa: parsed.data.responsableRevisa ?? null,
        faseId: parsed.data.faseId || null,
        orden: parsed.data.orden,
        plazoRevisionDias: parsed.data.plazoRevisionDias ?? null,
        permiteMultiples: parsed.data.permiteMultiples ?? false,
        transversal: parsed.data.transversal ?? false,
      },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Instrumento",
      entidadId: actualizado.id,
      accion: "UPDATE",
      valorAnterior: { nombre: actual.nombre, orden: actual.orden, faseId: actual.faseId },
      valorNuevo: { nombre: actualizado.nombre, orden: actualizado.orden, faseId: actualizado.faseId },
    });
  } catch (error) {
    console.error("No se pudo editar el instrumento", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}

export async function toggleActivoInstrumento(
  _prevState: CatalogoActionState,
  formData: FormData
): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = toggleCatalogoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Instrumento inválido." };

  const actual = await prisma.instrumento.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "El instrumento ya no existe." };

  try {
    const actualizado = await prisma.instrumento.update({
      where: { id: actual.id },
      data: { activo: !actual.activo },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Instrumento",
      entidadId: actualizado.id,
      accion: "UPDATE",
      valorAnterior: { activo: actual.activo },
      valorNuevo: { activo: actualizado.activo },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado del instrumento", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}


export type CrearReglaAvanceState = { error?: string; success?: boolean };

export async function crearReglaAvance(
  _prevState: CrearReglaAvanceState,
  formData: FormData
): Promise<CrearReglaAvanceState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = crearReglaAvanceSchema.safeParse({
    nombre: formData.get("nombre"),
    faseOrigenId: formData.get("faseOrigenId") || undefined,
    faseDestinoId: formData.get("faseDestinoId"),
    instrumentosClaves: formData.getAll("instrumentosClaves"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const regla = await prisma.reglaAvance.create({
      data: {
        nombre: parsed.data.nombre,
        faseOrigenId: parsed.data.faseOrigenId || null,
        faseDestinoId: parsed.data.faseDestinoId,
        instrumentosClaves: parsed.data.instrumentosClaves,
      },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "ReglaAvance",
      entidadId: regla.id,
      accion: "CREATE",
      valorNuevo: { nombre: regla.nombre, faseDestinoId: regla.faseDestinoId, instrumentosClaves: parsed.data.instrumentosClaves },
    });
  } catch (error) {
    console.error("No se pudo crear la regla de avance", error);
    return { error: "No se pudo crear la regla. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return { success: true };
}

export async function toggleActivaReglaAvance(
  _prevState: CatalogoActionState,
  formData: FormData
): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = toggleCatalogoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Regla inválida." };

  const actual = await prisma.reglaAvance.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La regla ya no existe." };

  try {
    const actualizada = await prisma.reglaAvance.update({
      where: { id: actual.id },
      data: { activa: !actual.activa },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "ReglaAvance",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { activa: actual.activa },
      valorNuevo: { activa: actualizada.activa },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado de la regla", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  return initialOk;
}


export type CrearCohorteState = { error?: string; success?: boolean };

export async function crearCohorte(_prevState: CrearCohorteState, formData: FormData): Promise<CrearCohorteState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = cohorteSchema.safeParse({
    nombre: formData.get("nombre"),
    sede: formData.get("sede") || undefined,
    fechaInicio: formData.get("fechaInicio") || undefined,
    fechaFin: formData.get("fechaFin") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const cohorte = await prisma.cohorte.create({
      data: {
        nombre: parsed.data.nombre,
        sede: parsed.data.sede || null,
        fechaInicio: parsed.data.fechaInicio ? new Date(`${parsed.data.fechaInicio}T00:00:00`) : null,
        fechaFin: parsed.data.fechaFin ? new Date(`${parsed.data.fechaFin}T00:00:00`) : null,
      },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Cohorte",
      entidadId: cohorte.id,
      accion: "CREATE",
      valorNuevo: { nombre: cohorte.nombre, sede: cohorte.sede },
    });
  } catch (error) {
    console.error("No se pudo crear la cohorte", error);
    return { error: "No se pudo crear la cohorte. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  revalidatePath("/emprendedores");
  return { success: true };
}

export async function editarCohorte(_prevState: CatalogoActionState, formData: FormData): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = editarCohorteSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    sede: formData.get("sede") || undefined,
    fechaInicio: formData.get("fechaInicio") || undefined,
    fechaFin: formData.get("fechaFin") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const actual = await prisma.cohorte.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La cohorte ya no existe." };

  try {
    const actualizada = await prisma.cohorte.update({
      where: { id: parsed.data.id },
      data: {
        nombre: parsed.data.nombre,
        sede: parsed.data.sede || null,
        fechaInicio: parsed.data.fechaInicio ? new Date(`${parsed.data.fechaInicio}T00:00:00`) : null,
        fechaFin: parsed.data.fechaFin ? new Date(`${parsed.data.fechaFin}T00:00:00`) : null,
      },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Cohorte",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { nombre: actual.nombre, sede: actual.sede },
      valorNuevo: { nombre: actualizada.nombre, sede: actualizada.sede },
    });
  } catch (error) {
    console.error("No se pudo editar la cohorte", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  revalidatePath("/emprendedores");
  return initialOk;
}

export async function toggleActivaCohorte(
  _prevState: CatalogoActionState,
  formData: FormData
): Promise<CatalogoActionState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = toggleCohorteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Cohorte inválida." };

  const actual = await prisma.cohorte.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "La cohorte ya no existe." };

  try {
    const actualizada = await prisma.cohorte.update({ where: { id: actual.id }, data: { activa: !actual.activa } });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Cohorte",
      entidadId: actualizada.id,
      accion: "UPDATE",
      valorAnterior: { activa: actual.activa },
      valorNuevo: { activa: actualizada.activa },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado de la cohorte", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidarConfiguracion();
  revalidatePath("/emprendedores");
  return initialOk;
}
