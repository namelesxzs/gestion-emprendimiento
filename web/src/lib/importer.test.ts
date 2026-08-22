import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { construirExcelEmprendedores } from "@/test/xlsx";
import { analizarExcel } from "./importer";

const FILA_VALIDA = {
  Nombre: "Ana Gómez",
  Emprendimiento: "EcoBolsas",
  Sector: "Ambiental",
  Etapa_UIE: "Descubrir",
  Estado: "Activo",
  Fecha_Ingreso: "2026-01-15",
  Correo: "ana@test.com",
  Telefono: "3001111111",
};

beforeEach(async () => {
  await limpiarDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("analizarExcel — archivo inválido", () => {
  it("reporta error si el buffer no es un .xlsx válido", async () => {
    const r = await analizarExcel(Buffer.from("esto no es un xlsx"));
    expect(r.ok).toBe(false);
    expect(r.errorGeneral).toMatch(/corrupto/i);
  });

  it("reporta error si falta la hoja Emprendedores", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("OtraHoja");
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    const r = await analizarExcel(buffer);
    expect(r.ok).toBe(false);
    expect(r.errorGeneral).toMatch(/Emprendedores/);
  });

  it("reporta error si falta una columna obligatoria", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Emprendedores");
    ws.addRow(["Nombre", "Emprendimiento"]); // faltan casi todas las columnas
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    const r = await analizarExcel(buffer);
    expect(r.ok).toBe(false);
    expect(r.errorGeneral).toMatch(/columnas obligatorias/i);
  });
});

describe("analizarExcel — validación por fila", () => {
  it("marca como error una fila con etapa no reconocida, sin tumbar el resto del archivo", async () => {
    const buffer = await construirExcelEmprendedores([
      FILA_VALIDA,
      { ...FILA_VALIDA, Correo: "otro@test.com", Etapa_UIE: "NoExiste" },
    ]);

    const r = await analizarExcel(buffer);

    expect(r.ok).toBe(true);
    expect(r.nuevos).toBe(1);
    expect(r.errores).toBe(1);
    expect(r.filas.find((f) => f.estado === "error")?.errores?.[0].columna).toBe("Etapa_UIE");
  });

  it("marca como duplicado_en_archivo la segunda fila con el mismo correo", async () => {
    const buffer = await construirExcelEmprendedores([FILA_VALIDA, { ...FILA_VALIDA, Nombre: "Ana Otra" }]);

    const r = await analizarExcel(buffer);

    expect(r.nuevos).toBe(1);
    expect(r.errores).toBe(1);
    expect(r.filas[1].estado).toBe("duplicado_en_archivo");
  });

  it("ignora filas completamente vacías", async () => {
    const buffer = await construirExcelEmprendedores([
      FILA_VALIDA,
      { Nombre: "", Emprendimiento: "", Sector: "", Etapa_UIE: "", Estado: "", Fecha_Ingreso: "", Correo: "", Telefono: "" },
    ]);

    const r = await analizarExcel(buffer);

    expect(r.totalFilas).toBe(1);
  });
});

describe("analizarExcel — diff contra la base de datos", () => {
  it("una fila nueva (correo que no existe en la BD) se marca como 'nuevo'", async () => {
    const buffer = await construirExcelEmprendedores([FILA_VALIDA]);
    const r = await analizarExcel(buffer);

    expect(r.filas[0].estado).toBe("nuevo");
    expect(r.nuevos).toBe(1);
  });

  it("una fila que coincide por correo con un emprendedor existente y trae cambios se marca 'actualizado', listando los campos que cambiaron", async () => {
    const existente = await prisma.emprendedor.create({
      data: {
        nombre: "Ana Gómez",
        emprendimiento: "EcoBolsas",
        sector: "Ambiental",
        etapa: "Descubrir",
        estado: "Activo",
        fechaIngreso: new Date("2026-01-15T00:00:00"),
        correo: "ana@test.com",
        telefono: "3001111111",
      },
    });

    const buffer = await construirExcelEmprendedores([{ ...FILA_VALIDA, Etapa_UIE: "Incubar" }]);
    const r = await analizarExcel(buffer);

    expect(r.filas[0].estado).toBe("actualizado");
    expect(r.filas[0].emprendedorId).toBe(existente.id);
    expect(r.filas[0].cambios).toEqual([{ campo: "etapa", anterior: "Descubrir", nuevo: "Incubar" }]);
    expect(r.actualizados).toBe(1);
  });

  it("una fila idéntica a un emprendedor existente se marca 'sin_cambios' — es idempotente reimportar el mismo archivo", async () => {
    await prisma.emprendedor.create({
      data: {
        nombre: "Ana Gómez",
        emprendimiento: "EcoBolsas",
        sector: "Ambiental",
        etapa: "Descubrir",
        estado: "Activo",
        fechaIngreso: new Date("2026-01-15T00:00:00"),
        correo: "ana@test.com",
        telefono: "3001111111",
      },
    });

    const buffer = await construirExcelEmprendedores([FILA_VALIDA]);

    const primeraCorrida = await analizarExcel(buffer);
    const segundaCorrida = await analizarExcel(buffer);

    expect(primeraCorrida.filas[0].estado).toBe("sin_cambios");
    expect(segundaCorrida.filas[0].estado).toBe("sin_cambios");
    expect(primeraCorrida.sinCambios).toBe(1);
  });

  it("nunca modifica la base de datos por sí sola (analizarExcel es de solo lectura)", async () => {
    const buffer = await construirExcelEmprendedores([FILA_VALIDA]);
    await analizarExcel(buffer);

    const count = await prisma.emprendedor.count();
    expect(count).toBe(0);
  });
});
