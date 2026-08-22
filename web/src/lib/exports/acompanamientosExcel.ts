import ExcelJS from "exceljs";
import type { Acompanamiento } from "@/lib/types";

const ENCABEZADOS = [
  "Emprendedor",
  "Fecha",
  "Etapa",
  "Diagnóstico",
  "Recomendaciones",
  "Compromisos",
  "Estado del compromiso",
  "Avance (%)",
];

interface FilaAcompanamiento extends Acompanamiento {
  emprendedorNombre: string;
}

export async function generarExcelAcompanamientos(rows: FilaAcompanamiento[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plataforma UIE";
  wb.created = new Date();

  const ws = wb.addWorksheet("Acompañamientos", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = ENCABEZADOS.map((h) => ({
    header: h,
    key: h,
    width: h === "Diagnóstico" || h === "Recomendaciones" || h === "Compromisos" ? 40 : 20,
  }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const a of rows) {
    ws.addRow([
      a.emprendedorNombre,
      a.fecha,
      a.etapa,
      a.diagnostico,
      a.recomendaciones,
      a.compromisos,
      a.estado,
      a.avancePct,
    ]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
