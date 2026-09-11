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

export type CatalogoActionState = { error?: string; success?: boolean };
const initialOk: CatalogoActionState = { success: true };

function revalidarConfiguracion() {
  revalidatePath("/configuracion");
  revalidatePath("/ruta");
}

// --- Fase -------------------------------------------------------------

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

// --- Etapa --------------------------------------------------------------

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

// --- Instrumento ----------------------------------------------------------

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
    // Desactivar/activar un instrumento nunca borra las InstrumentoRespuesta
    // ya diligenciadas — solo cambia si aparece en /ruta y en los
    // formularios de captura para emprendedores nuevos.
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

// --- Reglas de avance -------------------------------------------------

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
