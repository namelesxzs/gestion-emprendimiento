"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireSession, requireOwnEmprendedor, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { puedeDiligenciarInstrumento, puedeRevisarInstrumento } from "@/lib/catalogo/permisos";
import {
  extraerDatosFormulario,
  guardarRespuestaInstrumentoSchema,
  revisarRespuestaInstrumentoSchema,
  sellarFirmas,
  validarDatosInstrumento,
  type CampoRuntime,
} from "@/lib/validation/catalogo";

export type GuardarRespuestaInstrumentoState = { error?: string; success?: boolean };

export async function guardarRespuestaInstrumento(
  _prevState: GuardarRespuestaInstrumentoState,
  formData: FormData
): Promise<GuardarRespuestaInstrumentoState> {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = guardarRespuestaInstrumentoSchema.safeParse({
    instrumentoId: formData.get("instrumentoId"),
    emprendedorId: formData.get("emprendedorId"),
    respuestaId: formData.get("respuestaId") || undefined,
  });
  if (!parsed.success) return { error: "Datos inválidos." };

  if (session.user.rol === "EMPRENDEDOR") {
    try {
      requireOwnEmprendedor(session, parsed.data.emprendedorId);
    } catch (error) {
      if (error instanceof AuthzError) return { error: error.message };
      throw error;
    }
  }

  const instrumento = await prisma.instrumento.findUnique({ where: { id: parsed.data.instrumentoId } });
  if (!instrumento) return { error: "El instrumento ya no existe." };
  if (!instrumento.activo) return { error: "Este instrumento fue desactivado por el Administrador." };

  if (!puedeDiligenciarInstrumento(session.user.rol, instrumento.responsableDiligencia)) {
    return {
      error:
        session.user.rol === "COORDINADOR"
          ? "El Coordinador consulta indicadores, no diligencia instrumentos."
          : `Este instrumento lo diligencia: ${instrumento.responsableDiligencia ?? "el asesor"}.`,
    };
  }

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: parsed.data.emprendedorId } });
  if (!emprendedor) return { error: "El emprendedor ya no existe." };

  let existente = null;
  if (parsed.data.respuestaId) {
    existente = await prisma.instrumentoRespuesta.findUnique({ where: { id: parsed.data.respuestaId } });
    if (!existente || existente.instrumentoId !== instrumento.id || existente.emprendedorId !== emprendedor.id) {
      return { error: "El registro que intentas editar no pertenece a este formato." };
    }
  } else if (!instrumento.permiteMultiples) {
    existente = await prisma.instrumentoRespuesta.findFirst({
      where: { instrumentoId: instrumento.id, emprendedorId: emprendedor.id },
      orderBy: { updatedAt: "desc" },
    });
  }

  const campos = (instrumento.camposSchema as unknown as CampoRuntime[]) ?? [];
  const validacion = validarDatosInstrumento(campos, extraerDatosFormulario(campos, formData));
  if (!validacion.ok) return { error: validacion.error };

  const usuario = await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { nombre: true } });
  const firmado = sellarFirmas(
    campos,
    validacion.datos,
    (existente?.datos as Record<string, unknown> | undefined) ?? null,
    { id: session.user.id, nombre: usuario?.nombre ?? session.user.name ?? "", rol: session.user.rol }
  );
  if (!firmado.ok) return { error: firmado.error };

  const datosJson = JSON.parse(JSON.stringify(firmado.datos)) as Prisma.InputJsonValue;

  try {
    const respuesta = existente
      ? await prisma.instrumentoRespuesta.update({
          where: { id: existente.id },
          data: {
            datos: datosJson,
            registradoPorId: session.user.id,
            estadoRevision: "Pendiente",
            revisadoPorId: null,
            revisadoEn: null,
          },
        })
      : await prisma.instrumentoRespuesta.create({
          data: {
            instrumentoId: instrumento.id,
            emprendedorId: emprendedor.id,
            datos: datosJson,
            registradoPorId: session.user.id,
          },
        });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "InstrumentoRespuesta",
      entidadId: respuesta.id,
      accion: existente ? "UPDATE" : "CREATE",
      valorAnterior: existente ? { datos: existente.datos } : undefined,
      valorNuevo: { instrumento: instrumento.nombre, emprendedorId: emprendedor.id, datos: datosJson },
    });
  } catch (error) {
    console.error("No se pudo guardar la respuesta del instrumento", error);
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  revalidatePath("/");
  return { success: true };
}

export type RevisarRespuestaInstrumentoState = { error?: string; success?: boolean };

export async function revisarRespuestaInstrumento(
  _prevState: RevisarRespuestaInstrumentoState,
  formData: FormData
): Promise<RevisarRespuestaInstrumentoState> {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = revisarRespuestaInstrumentoSchema.safeParse({
    respuestaId: formData.get("respuestaId"),
    decision: formData.get("decision"),
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) return { error: "Datos inválidos." };
  if (parsed.data.decision === "Devuelto" && !parsed.data.comentario) {
    return { error: "Para devolver un formato escribe qué debe corregirse." };
  }

  const respuesta = await prisma.instrumentoRespuesta.findUnique({
    where: { id: parsed.data.respuestaId },
    include: { instrumento: true },
  });
  if (!respuesta) return { error: "El registro ya no existe." };

  if (!puedeRevisarInstrumento(session.user.rol, respuesta.instrumento.responsableRevisa)) {
    return { error: `Este formato lo revisa: ${respuesta.instrumento.responsableRevisa ?? "el Administrador"}.` };
  }

  try {
    await prisma.instrumentoRespuesta.update({
      where: { id: respuesta.id },
      data: {
        estadoRevision: parsed.data.decision,
        revisadoPorId: session.user.id,
        revisadoEn: new Date(),
        comentarioRevision: parsed.data.comentario ?? null,
      },
    });
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "InstrumentoRespuesta",
      entidadId: respuesta.id,
      accion: "UPDATE",
      valorAnterior: { estadoRevision: respuesta.estadoRevision },
      valorNuevo: { estadoRevision: parsed.data.decision, comentario: parsed.data.comentario ?? null },
    });
  } catch (error) {
    console.error("No se pudo registrar la revisión", error);
    return { error: "No se pudo guardar la revisión. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  revalidatePath("/");
  return { success: true };
}
