import ExcelJS from "exceljs";
import { ETAPAS, ESTADOS_EMPRENDEDOR } from "@/lib/validation/emprendedor";
import { COLUMNAS_REQUERIDAS, COLUMNA_OPCIONAL_RESPONSABLE } from "@/lib/validation/importar";

const ENCABEZADOS = [...COLUMNAS_REQUERIDAS.slice(0, 6), COLUMNA_OPCIONAL_RESPONSABLE, ...COLUMNAS_REQUERIDAS.slice(6)];
// Orden final: Nombre, Emprendimiento, Sector, Etapa_UIE, Estado,
// Fecha_Ingreso, Responsable, Correo, Telefono — sin columna "ID": el
// importador nunca la usa (la clave de matching es Correo), incluirla solo
// confundiría sobre qué campo identifica al emprendedor.

const FILA_EJEMPLO = [
  "Juan Pérez",
  "Mi Emprendimiento S.A.S.",
  "Tecnología",
  "Descubrir",
  "Activo",
  "2026-01-15",
  "Nombre del docente/mentor",
  "correo@ejemplo.com",
  "3001234567",
];

export async function generarPlantillaEmprendedores(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plataforma UIE";
  wb.created = new Date();

  const ws = wb.addWorksheet("Emprendedores", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = ENCABEZADOS.map((h) => ({ header: h, key: h, width: h === "Nombre" || h === "Emprendimiento" ? 26 : 20 }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const ejemploRow = ws.addRow(FILA_EJEMPLO);
  ejemploRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF3D0" } };
    cell.font = { italic: true, color: { argb: "FF7A6A2E" } };
  });
  ws.getCell(`A${ejemploRow.number}`).note =
    "Esta es una fila de EJEMPLO — bórrala o reemplázala. Muestra el formato esperado en cada columna.";

  const colIndex = (nombre: string) => ENCABEZADOS.indexOf(nombre) + 1;

  // Listas desplegables para reducir errores de captura, hasta la fila 200.
  const ultimaFila = 200;
  for (let fila = 2; fila <= ultimaFila; fila++) {
    ws.getCell(fila, colIndex("Etapa_UIE")).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${ETAPAS.join(",")}"`],
      showErrorMessage: true,
      error: `Valores permitidos: ${ETAPAS.join(", ")}`,
    };
    ws.getCell(fila, colIndex("Estado")).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${ESTADOS_EMPRENDEDOR.join(",")}"`],
      showErrorMessage: true,
      error: `Valores permitidos: ${ESTADOS_EMPRENDEDOR.join(", ")}`,
    };
    ws.getCell(fila, colIndex("Fecha_Ingreso")).numFmt = "yyyy-mm-dd";
  }

  ws.getCell(`A1`).note =
    "Nombre completo del emprendedor.";
  ws.getCell(`D1`).note = `Valores permitidos: ${ETAPAS.join(", ")}`;
  ws.getCell(`E1`).note = `Valores permitidos: ${ESTADOS_EMPRENDEDOR.join(", ")}`;
  ws.getCell(`F1`).note = "Formato de fecha: AAAA-MM-DD (ej. 2026-01-15).";
  ws.getCell(`H1`).note =
    "Identifica al emprendedor entre importaciones — si ya existe un registro con este correo, se actualiza en vez de duplicarse.";

  const instrucciones = wb.addWorksheet("Instrucciones");
  instrucciones.columns = [{ width: 90 }];
  instrucciones.addRows([
    ["Cómo usar esta plantilla"],
    [""],
    ["1. No cambies los nombres de las columnas en la fila 1 de la hoja «Emprendedores»."],
    ["2. Borra o reemplaza la fila de ejemplo (resaltada en amarillo)."],
    ["3. Una fila = un emprendedor. El Correo identifica a cada uno: si ya existe, se actualiza; si no, se crea."],
    [`4. Etapa_UIE solo acepta: ${ETAPAS.join(", ")}.`],
    [`5. Estado solo acepta: ${ESTADOS_EMPRENDEDOR.join(", ")}.`],
    ["6. Fecha_Ingreso en formato AAAA-MM-DD."],
    ["7. Sube el archivo en Importar Excel → verás una previsualización antes de que se guarde nada."],
    ["8. Importar de nuevo el mismo archivo no duplica registros ni borra historial de acompañamientos o reuniones."],
  ]);
  instrucciones.getCell("A1").font = { bold: true, size: 13 };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
