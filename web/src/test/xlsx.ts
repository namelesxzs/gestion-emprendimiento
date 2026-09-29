import ExcelJS from "exceljs";
import { COLUMNAS_REQUERIDAS, COLUMNA_OPCIONAL_RESPONSABLE } from "@/lib/validation/importar";

export async function construirExcelEmprendedores(filas: Record<string, string>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Emprendedores");
  const encabezados = [...COLUMNAS_REQUERIDAS, COLUMNA_OPCIONAL_RESPONSABLE];
  ws.addRow([...encabezados]);
  for (const fila of filas) {
    ws.addRow(encabezados.map((h) => fila[h] ?? ""));
  }
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
