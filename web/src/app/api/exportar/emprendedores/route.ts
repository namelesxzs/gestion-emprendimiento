import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthzError } from "@/lib/authz";
import { getAllAcompanamientos, getEmprendedores } from "@/lib/queries";
import { getUltimoAvance } from "@/lib/view";
import { generarExcelEmprendedores } from "@/lib/exports/emprendedoresExcel";
import type { Etapa, EstadoEmprendedor } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMINISTRADOR", "DOCENTE", "COORDINADOR");
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const etapas = searchParams.get("etapas")?.split(",").filter(Boolean) as Etapa[] | undefined;
  const estados = searchParams.get("estados")?.split(",").filter(Boolean) as EstadoEmprendedor[] | undefined;

  const [emprendedores, acompanamientos] = await Promise.all([getEmprendedores(), getAllAcompanamientos()]);

  // Sin filtros en la URL = exportar todo, igual que la tabla sin filtrar.
  const filtrados = emprendedores.filter(
    (e) => (!etapas || etapas.includes(e.etapa)) && (!estados || estados.includes(e.estado))
  );

  const filas = filtrados.map((e) => ({ ...e, avance: getUltimoAvance(acompanamientos, e.id) }));
  const buffer = await generarExcelEmprendedores(filas);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Emprendedores_UIE_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
