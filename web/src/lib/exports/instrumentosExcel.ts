import ExcelJS from "exceljs";
import type { CampoInstrumentoDef, FirmaValor } from "@/lib/catalogo/tipos";

// Manual §5.5: "centralice las respuestas en una sola base de datos por
// cohorte, sede y asesor, facilitando el reporte de indicadores ante la
// Vicerrectoría y ante las convocatorias externas". Una hoja por formato,
// una fila por registro diligenciado, con cohorte/sede/asesor al frente.

export interface InstrumentoExport {
  clave: string;
  nombre: string;
  origenManual: string | null;
  campos: CampoInstrumentoDef[];
  respuestas: {
    emprendimiento: string;
    emprendedor: string;
    cohorte: string;
    sede: string;
    asesor: string;
    fase: string;
    registradoPor: string;
    actualizado: Date;
    estadoRevision: string;
    datos: Record<string, unknown>;
  }[];
}

const FIJAS = ["Emprendimiento", "Emprendedor", "Cohorte", "Sede", "Asesor", "Fase", "Registrado por", "Actualizado", "Revisión"];

/** Una celda de Excel por campo: las tablas del Manual se aplanan a texto
 * (una fila por línea) y las firmas muestran quién y cuándo. */
export function valorCelda(campo: CampoInstrumentoDef, valor: unknown): string | number {
  if (valor === undefined || valor === null) return "";
  if (campo.tipo === "firma") {
    const f = valor as FirmaValor;
    return f.nombre ? `${f.nombre} (${new Date(f.fecha).toLocaleString("es-CO")})` : "";
  }
  if (campo.tipo === "tabla" && Array.isArray(valor)) {
    return (valor as Record<string, unknown>[])
      .map((fila) => {
        const etiquetaFila = campo.filas?.find((f) => f.clave === fila.fila)?.etiqueta;
        const celdas = (campo.columnas ?? [])
          .filter((c) => fila[c.clave] !== "" && fila[c.clave] !== undefined)
          .map((c) => `${c.etiqueta}: ${fila[c.clave]}`);
        return `${etiquetaFila ? `${etiquetaFila} — ` : ""}${celdas.join("; ")}`;
      })
      .join("\n");
  }
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number") return valor;
  return String(valor);
}

export async function generarExcelInstrumentos(instrumentos: InstrumentoExport[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Plataforma UIE";
  wb.created = new Date();

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Manual", key: "origen", width: 16 },
    { header: "Formato", key: "nombre", width: 60 },
    { header: "Registros", key: "registros", width: 12 },
  ];

  const usados = new Set<string>();
  for (const inst of instrumentos) {
    resumen.addRow({ origen: inst.origenManual ?? "", nombre: inst.nombre, registros: inst.respuestas.length });

    // Nombre de hoja: máx. 31 caracteres, sin caracteres prohibidos, único.
    let nombreHoja = `${inst.origenManual ?? ""} ${inst.nombre}`.replace(/[\\/*?:[\]]/g, "-").trim().slice(0, 31);
    for (let n = 2; usados.has(nombreHoja); n++) nombreHoja = `${nombreHoja.slice(0, 28)} ${n}`;
    usados.add(nombreHoja);

    const ws = wb.addWorksheet(nombreHoja, { views: [{ state: "frozen", ySplit: 1 }] });
    const encabezados = [...FIJAS, ...inst.campos.map((c) => c.etiqueta)];
    ws.columns = encabezados.map((h, i) => ({ header: h, key: `c${i}`, width: i < FIJAS.length ? 20 : 30 }));
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });

    for (const r of inst.respuestas) {
      const fila = ws.addRow([
        r.emprendimiento,
        r.emprendedor,
        r.cohorte,
        r.sede,
        r.asesor,
        r.fase,
        r.registradoPor,
        r.actualizado.toLocaleString("es-CO"),
        r.estadoRevision,
        ...inst.campos.map((c) => valorCelda(c, r.datos[c.clave])),
      ]);
      fila.alignment = { vertical: "top", wrapText: true };
    }
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
