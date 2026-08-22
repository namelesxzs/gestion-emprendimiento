import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole, AuthzError } from "@/lib/authz";
import { getAllAcompanamientos, getAllReuniones, getEmprendedorById } from "@/lib/queries";
import { FichaEmprendedorPdf } from "@/lib/pdf/FichaEmprendedorPdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMINISTRADOR", "DOCENTE", "COORDINADOR");
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { id } = await params;
  const emprendedor = await getEmprendedorById(id);
  if (!emprendedor) {
    return NextResponse.json({ error: "Emprendedor no encontrado" }, { status: 404 });
  }

  const [acompanamientos, reuniones] = await Promise.all([
    getAllAcompanamientos(id),
    getAllReuniones(id),
  ]);

  const buffer = await renderToBuffer(
    <FichaEmprendedorPdf emprendedor={emprendedor} acompanamientos={acompanamientos} reuniones={reuniones} />
  );

  const nombreArchivo = emprendedor.nombre
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-zA-Z0-9]+/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Ficha_${nombreArchivo}.pdf"`,
    },
  });
}
