"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireSession, requireOwnEmprendedor, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import {
  guardarRespuestaInstrumentoSchema,
  validarDatosInstrumento,
  type CampoRuntime,
} from "@/lib/validation/catalogo";

export type GuardarRespuestaInstrumentoState = { error?: string; success?: boolean };

/**
 * Guarda (crea o actualiza) la respuesta de un Instrumento del catálogo para
 * un Emprendedor — el motor de formularios genérico: los campos válidos
 * vienen del `camposSchema` del propio instrumento, no de código nuevo por
 * cada formato (ver auditoría §07/§08, C3).
 */
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
  });
  if (!parsed.success) return { error: "Datos inválidos." };

  // Un Emprendedor solo puede diligenciar instrumentos de su propio
  // registro (RF13) — Administrador y Docente pueden hacerlo por cualquiera.
  if (session.user.rol === "EMPRENDEDOR") {
    try {
      requireOwnEmprendedor(session, parsed.data.emprendedorId);
    } catch (error) {
      if (error instanceof AuthzError) return { error: error.message };
      throw error;
    }
  } else if (session.user.rol === "COORDINADOR") {
    return { error: "El Coordinador consulta indicadores, no diligencia instrumentos." };
  }

  const instrumento = await prisma.instrumento.findUnique({ where: { id: parsed.data.instrumentoId } });
  if (!instrumento) return { error: "El instrumento ya no existe." };
  if (!instrumento.activo) return { error: "Este instrumento fue desactivado por el Administrador." };

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: parsed.data.emprendedorId } });
  if (!emprendedor) return { error: "El emprendedor ya no existe." };

  const campos = (instrumento.camposSchema as unknown as CampoRuntime[]) ?? [];
  const valoresCrudos: Record<string, unknown> = {};
  for (const campo of campos) {
    valoresCrudos[campo.clave] = campo.tipo === "booleano" ? formData.get(campo.clave) === "on" : formData.get(campo.clave);
  }

  const validacion = validarDatosInstrumento(campos, valoresCrudos);
  if (!validacion.ok) return { error: validacion.error };

  const datosJson = JSON.parse(JSON.stringify(validacion.datos)) as Prisma.InputJsonValue;

  try {
    const respuesta = await prisma.instrumentoRespuesta.upsert({
      where: { instrumentoId_emprendedorId: { instrumentoId: instrumento.id, emprendedorId: emprendedor.id } },
      update: { datos: datosJson, registradoPorId: session.user.id },
      create: {
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
      accion: "UPDATE",
      valorNuevo: { instrumento: instrumento.nombre, emprendedorId: emprendedor.id },
    });
  } catch (error) {
    console.error("No se pudo guardar la respuesta del instrumento", error);
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  return { success: true };
}
