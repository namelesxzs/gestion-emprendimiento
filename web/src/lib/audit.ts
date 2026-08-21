import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type OrigenAuditoria = "MANUAL" | "IMPORTACION_EXCEL" | "SISTEMA" | "ADMINISTRACION";
export type AccionAuditoria = "CREATE" | "UPDATE" | "DELETE" | "LOGIN";

interface AuditContext {
  usuarioId?: string | null;
  rol?: string | null;
  origen: OrigenAuditoria;
  importRunId?: string | null;
}

interface AuditRecordParams extends AuditContext {
  entidad: string;
  entidadId: string;
  accion: AccionAuditoria;
  valorAnterior?: Prisma.InputJsonValue | null;
  valorNuevo?: Prisma.InputJsonValue | null;
  resultado?: "EXITO" | "ERROR";
}

/** Escribe una entrada de auditoría. Nunca lanza — un fallo de auditoría no debe tumbar la operación de negocio, pero sí queda logueado en consola. */
export async function registrarAuditoria(params: AuditRecordParams) {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId ?? null,
        rolSnapshot: params.rol ?? null,
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        origen: params.origen,
        valorAnterior: params.valorAnterior ?? undefined,
        valorNuevo: params.valorNuevo ?? undefined,
        resultado: params.resultado ?? "EXITO",
        importRunId: params.importRunId ?? null,
      },
    });
  } catch (e) {
    console.error("No se pudo registrar auditoría", params.entidad, params.entidadId, e);
  }
}

/**
 * Envuelve una mutación de negocio con auditoría automática: registra éxito
 * (con el resultado como valorNuevo) o error, sin que el caller tenga que
 * acordarse de auditar cada operación por separado.
 */
export async function withAudit<T extends { id: string }>(
  ctx: AuditContext & { entidad: string; accion: AccionAuditoria; valorAnterior?: Prisma.InputJsonValue | null },
  fn: () => Promise<T>
): Promise<T> {
  try {
    const resultado = await fn();
    await registrarAuditoria({
      ...ctx,
      entidadId: resultado.id,
      valorNuevo: resultado as unknown as Prisma.InputJsonValue,
      resultado: "EXITO",
    });
    return resultado;
  } catch (e) {
    await registrarAuditoria({
      ...ctx,
      entidadId: "desconocido",
      resultado: "ERROR",
    });
    throw e;
  }
}
