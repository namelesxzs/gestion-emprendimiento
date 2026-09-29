import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireOwnEmprendedor, AuthzError } from "@/lib/authz";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { id } = await params;
  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  try {
    requireOwnEmprendedor(session, documento.emprendedorId);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(documento.storagePath);
  } catch (error) {
    console.error("No se pudo leer el documento del disco", documento.id, error);
    return NextResponse.json({ error: "El archivo ya no está disponible" }, { status: 404 });
  }

  const nombreSeguro = documento.nombreArchivo
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": documento.mimeType,
      "Content-Disposition": `inline; filename="${nombreSeguro}"`,
    },
  });
}
