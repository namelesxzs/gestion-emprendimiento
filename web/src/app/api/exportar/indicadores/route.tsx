import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole, AuthzError } from "@/lib/authz";
import {
  getAllAcompanamientos,
  getAllCompromisos,
  getAllReuniones,
  getEmprendedores,
  getEmprendedoresPorSede,
} from "@/lib/queries";
import { IndicadoresPdf } from "@/lib/pdf/IndicadoresPdf";

export async function GET() {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR", "COORDINADOR");
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const [emprendedores, acompanamientos, reuniones, compromisos, emprendedoresPorSede] = await Promise.all([
    getEmprendedores(),
    getAllAcompanamientos(),
    getAllReuniones(),
    getAllCompromisos(),
    getEmprendedoresPorSede(),
  ]);

  const buffer = await renderToBuffer(
    <IndicadoresPdf
      emprendedores={emprendedores}
      acompanamientos={acompanamientos}
      reuniones={reuniones}
      compromisos={compromisos}
      emprendedoresPorSede={emprendedoresPorSede}
      generadoPor={session.user.name ?? session.user.email ?? "—"}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Indicadores_UIE_${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
