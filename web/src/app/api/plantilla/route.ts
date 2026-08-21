import { NextResponse } from "next/server";
import { requireRole, AuthzError } from "@/lib/authz";
import { generarPlantillaEmprendedores } from "@/lib/plantilla";

export async function GET() {
  try {
    await requireRole("ADMINISTRADOR", "DOCENTE");
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const buffer = await generarPlantillaEmprendedores();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Plantilla_Emprendedores_UIE.xlsx"',
    },
  });
}
