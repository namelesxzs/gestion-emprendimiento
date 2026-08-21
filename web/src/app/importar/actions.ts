"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { analizarExcel, TAMANO_MAXIMO_BYTES, type ResultadoAnalisis } from "@/lib/importer";

export type AnalizarState = {
  error?: string;
  resultado?: ResultadoAnalisis;
  archivoBase64?: string;
  nombreArchivo?: string;
};

export async function analizarArchivo(_prevState: AnalizarState, formData: FormData): Promise<AnalizarState> {
  try {
    // Importar Excel también queda restringido a Administrador/Docente.
    await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo .xlsx" };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { error: "El archivo debe tener extensión .xlsx" };
  }
  if (file.size > TAMANO_MAXIMO_BYTES) {
    return { error: `El archivo supera el tamaño máximo permitido (${TAMANO_MAXIMO_BYTES / 1024 / 1024}MB).` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resultado = await analizarExcel(buffer);

  if (!resultado.ok) {
    return { error: resultado.errorGeneral ?? "No se pudo analizar el archivo." };
  }

  return {
    resultado,
    archivoBase64: buffer.toString("base64"),
    nombreArchivo: file.name,
  };
}

export type ConfirmarState = {
  error?: string;
  success?: boolean;
  resumen?: { nuevos: number; actualizados: number; sinCambios: number; errores: number };
};

export async function confirmarImportacion(
  _prevState: ConfirmarState,
  formData: FormData
): Promise<ConfirmarState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const archivoBase64 = formData.get("archivoBase64");
  const nombreArchivo = formData.get("nombreArchivo");
  if (typeof archivoBase64 !== "string" || typeof nombreArchivo !== "string" || !archivoBase64) {
    return { error: "Sesión de importación inválida o expirada. Vuelve a analizar el archivo." };
  }

  const buffer = Buffer.from(archivoBase64, "base64");
  const archivoHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Se recalcula el diff contra el estado ACTUAL de la BD justo antes de
  // aplicar (no se confía en lo que el cliente vio en el preview) — así la
  // importación es idempotente incluso si la BD cambió entre el preview y
  // la confirmación, o si el usuario reenvía el mismo archivo dos veces.
  const resultado = await analizarExcel(buffer);
  if (!resultado.ok) {
    return { error: resultado.errorGeneral ?? "No se pudo procesar el archivo." };
  }

  const importRun = await prisma.importRun.create({
    data: {
      usuarioId: session.user.id,
      archivoNombre: nombreArchivo,
      archivoHash,
      totalFilas: resultado.totalFilas,
      nuevos: resultado.nuevos,
      actualizados: resultado.actualizados,
      sinCambios: resultado.sinCambios,
      errores: resultado.errores,
      estado: "EN_PROGRESO",
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      for (const fila of resultado.filas) {
        if (fila.estado === "nuevo" && fila.datos) {
          const creado = await tx.emprendedor.create({
            data: {
              nombre: fila.datos.nombre,
              emprendimiento: fila.datos.emprendimiento,
              sector: fila.datos.sector,
              etapa: fila.datos.etapa,
              estado: fila.datos.estado,
              fechaIngreso: new Date(`${fila.datos.fechaIngreso}T00:00:00`),
              correo: fila.datos.correo,
              telefono: fila.datos.telefono,
              lastImportRunId: importRun.id,
            },
          });
          await tx.auditLog.create({
            data: {
              usuarioId: session.user.id,
              rolSnapshot: session.user.rol,
              entidad: "Emprendedor",
              entidadId: creado.id,
              accion: "CREATE",
              origen: "IMPORTACION_EXCEL",
              valorNuevo: { nombre: creado.nombre, correo: creado.correo, etapa: creado.etapa },
              importRunId: importRun.id,
            },
          });
        } else if (fila.estado === "actualizado" && fila.datos && fila.emprendedorId) {
          // Nunca se toca el historial (acompañamientos/compromisos/
          // reuniones) desde el importador — solo campos maestros.
          const actualizado = await tx.emprendedor.update({
            where: { id: fila.emprendedorId },
            data: {
              nombre: fila.datos.nombre,
              emprendimiento: fila.datos.emprendimiento,
              sector: fila.datos.sector,
              etapa: fila.datos.etapa,
              estado: fila.datos.estado,
              fechaIngreso: new Date(`${fila.datos.fechaIngreso}T00:00:00`),
              telefono: fila.datos.telefono,
              lastImportRunId: importRun.id,
            },
          });
          await tx.auditLog.create({
            data: {
              usuarioId: session.user.id,
              rolSnapshot: session.user.rol,
              entidad: "Emprendedor",
              entidadId: actualizado.id,
              accion: "UPDATE",
              origen: "IMPORTACION_EXCEL",
              valorAnterior: Object.fromEntries((fila.cambios ?? []).map((c) => [c.campo, c.anterior])),
              valorNuevo: Object.fromEntries((fila.cambios ?? []).map((c) => [c.campo, c.nuevo])),
              importRunId: importRun.id,
            },
          });
        }
        // "sin_cambios", "error" y "duplicado_en_archivo" no generan
        // ninguna escritura — RF: nunca eliminar/sobrescribir por ausencia
        // o error, y errores de fila no bloquean el resto del archivo.
      }
    });

    await prisma.importRun.update({ where: { id: importRun.id }, data: { estado: "CONFIRMADO" } });
  } catch (error) {
    console.error("La importación falló, se revirtió la transacción", error);
    await prisma.importRun.update({ where: { id: importRun.id }, data: { estado: "FALLIDO" } });
    return { error: "La importación falló y no se aplicó ningún cambio (transacción revertida). Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  revalidatePath("/");
  revalidatePath("/importar");

  return {
    success: true,
    resumen: {
      nuevos: resultado.nuevos,
      actualizados: resultado.actualizados,
      sinCambios: resultado.sinCambios,
      errores: resultado.errores,
    },
  };
}
