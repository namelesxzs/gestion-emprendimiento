"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireOwnEmprendedor, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import {
  revisarDocumentoSchema,
  TAMANO_MAX_BYTES,
  TIPOS_MIME_PERMITIDOS,
} from "@/lib/validation/documento";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "documentos");

export type SubirDocumentoState = { error?: string; success?: boolean };

export async function subirDocumento(
  _prevState: SubirDocumentoState,
  formData: FormData
): Promise<SubirDocumentoState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE", "EMPRENDEDOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const emprendedorId = String(formData.get("emprendedorId") ?? "");
  if (!emprendedorId) return { error: "Falta el emprendedor destino." };

  try {
    requireOwnEmprendedor(session, emprendedorId);
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo para subir." };
  }
  if (archivo.size > TAMANO_MAX_BYTES) {
    return { error: "El archivo supera el tamaño máximo permitido (10MB)." };
  }
  if (!TIPOS_MIME_PERMITIDOS.includes(archivo.type as (typeof TIPOS_MIME_PERMITIDOS)[number])) {
    return { error: "Tipo de archivo no permitido. Usa PDF, Word, PNG o JPG." };
  }

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: emprendedorId } });
  if (!emprendedor) return { error: "El emprendedor no existe." };

  const nombreSeguro = archivo.name.replace(/[\\/]/g, "_");
  const nombreArchivoDisco = `${randomUUID()}-${nombreSeguro}`;
  const carpetaDestino = path.join(STORAGE_ROOT, emprendedorId);
  const rutaDestino = path.join(carpetaDestino, nombreArchivoDisco);

  try {
    await mkdir(carpetaDestino, { recursive: true });
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await writeFile(rutaDestino, buffer);

    const documento = await prisma.documento.create({
      data: {
        emprendedorId,
        etapa: emprendedor.etapa,
        nombreArchivo: archivo.name,
        storagePath: rutaDestino,
        mimeType: archivo.type,
        tamanoBytes: archivo.size,
        subidoPorId: session.user.id,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Documento",
      entidadId: documento.id,
      accion: "CREATE",
      valorNuevo: {
        emprendedorId,
        etapa: documento.etapa,
        nombreArchivo: documento.nombreArchivo,
      },
    });
  } catch (error) {
    console.error("No se pudo guardar el documento", error);
    return { error: "No se pudo guardar el documento. Intenta de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/emprendedores");
  return { success: true };
}

export type RevisarDocumentoState = { error?: string; success?: boolean };

export async function revisarDocumento(
  _prevState: RevisarDocumentoState,
  formData: FormData
): Promise<RevisarDocumentoState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = revisarDocumentoSchema.safeParse({
    id: formData.get("id"),
    estado: formData.get("estado"),
    comentario: formData.get("comentario") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.documento.findUnique({ where: { id: parsed.data.id } });
  if (!actual) return { error: "El documento ya no existe." };

  try {
    const revisado = await prisma.documento.update({
      where: { id: parsed.data.id },
      data: {
        estado: parsed.data.estado,
        comentarioRevision: parsed.data.comentario ?? null,
        revisadoPorId: session.user.id,
        revisadoEn: new Date(),
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "MANUAL",
      entidad: "Documento",
      entidadId: revisado.id,
      accion: "UPDATE",
      valorAnterior: { estado: actual.estado },
      valorNuevo: { estado: revisado.estado, comentarioRevision: revisado.comentarioRevision },
    });
  } catch (error) {
    console.error("No se pudo revisar el documento", error);
    return { error: "No se pudo guardar la revisión. Intenta de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/emprendedores");
  return { success: true };
}
