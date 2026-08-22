import ExcelJS from "exceljs";
import type { Emprendedor } from "@/lib/types";

const ENCABEZADOS = [
  "Nombre",
  "Emprendimiento",
  "Sector",
  "Etapa",
  "Estado",
  "Responsable",
  "Correo",
  "Teléfono",
  "Fecha de ingreso",
  "Último avance (%)",
];

interface FilaEmprendedor extends Emprendedor {
  avance?: number;
}

export async function generarExcelEmprendedores(rows: FilaEmprendedor[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plataforma UIE";
  wb.created = new Date();

  const ws = wb.addWorksheet("Emprendedores", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = ENCABEZADOS.map((h) => ({
    header: h,
    key: h,
    width: h === "Nombre" || h === "Emprendimiento" ? 26 : 20,
  }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const e of rows) {
    ws.addRow([
      e.nombre,
      e.emprendimiento,
      e.sector,
      e.etapa,
      e.estado,
      e.responsable,
      e.correo,
      e.telefono,
      e.fechaIngreso,
      e.avance ?? "",
    ]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
