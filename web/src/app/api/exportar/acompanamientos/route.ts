import { NextResponse } from "next/server";
import { requireRole, AuthzError } from "@/lib/authz";
import { getAllAcompanamientos, getEmprendedores } from "@/lib/queries";
import { generarExcelAcompanamientos } from "@/lib/exports/acompanamientosExcel";

export async function GET() {
  try {
    await requireRole("ADMINISTRADOR", "DOCENTE", "COORDINADOR");
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const [acompanamientos, emprendedores] = await Promise.all([getAllAcompanamientos(), getEmprendedores()]);
  const nombrePorId = new Map(emprendedores.map((e) => [e.id, e.nombre]));

  const filas = acompanamientos.map((a) => ({
    ...a,
    emprendedorNombre: nombrePorId.get(a.emprendedorId) ?? "—",
  }));

  const buffer = await generarExcelAcompanamientos(filas);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Acompanamientos_UIE_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
