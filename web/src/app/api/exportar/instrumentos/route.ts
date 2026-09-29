import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import type { CampoInstrumentoDef } from "@/lib/catalogo/tipos";
import { generarExcelInstrumentos } from "@/lib/exports/instrumentosExcel";

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
  const cohorteId = searchParams.get("cohorteId") || undefined;
  const sede = searchParams.get("sede") || undefined;
  const asesorId = searchParams.get("asesorId") || undefined;

  const instrumentos = await prisma.instrumento.findMany({
    orderBy: { orden: "asc" },
    include: {
      respuestas: {
        where: { emprendedor: { cohorteId, sede, responsableId: asesorId } },
        orderBy: { updatedAt: "desc" },
        include: {
          registradoPor: { select: { nombre: true } },
          emprendedor: {
            include: {
              cohorte: { select: { nombre: true } },
              responsable: { select: { nombre: true } },
              fase: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  const buffer = await generarExcelInstrumentos(
    instrumentos.map((i) => ({
      clave: i.clave,
      nombre: i.nombre,
      origenManual: i.origenManual,
      campos: (i.camposSchema as unknown as CampoInstrumentoDef[]) ?? [],
      respuestas: i.respuestas.map((r) => ({
        emprendimiento: r.emprendedor.emprendimiento,
        emprendedor: r.emprendedor.nombre,
        cohorte: r.emprendedor.cohorte?.nombre ?? "",
        sede: r.emprendedor.sede ?? "",
        asesor: r.emprendedor.responsable?.nombre ?? "",
        fase: r.emprendedor.fase?.nombre ?? "",
        registradoPor: r.registradoPor.nombre,
        actualizado: r.updatedAt,
        estadoRevision: r.estadoRevision,
        datos: (r.datos as Record<string, unknown>) ?? {},
      })),
    }))
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Formatos_Ruta_Emprendimiento_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
