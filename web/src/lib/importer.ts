import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import {
  COLUMNAS_REQUERIDAS,
  COLUMNA_OPCIONAL_RESPONSABLE,
  filaEmprendedorSchema,
  CAMPOS_COMPARABLES,
  type FilaEmprendedorInput,
} from "@/lib/validation/importar";

const HOJA_EMPRENDEDORES = "Emprendedores";
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB, ver decisión §18 de la auditoría

export interface ErrorFila {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
}

export interface CambioCampo {
  campo: string;
  anterior: string;
  nuevo: string;
}

export type EstadoFila = "nuevo" | "actualizado" | "sin_cambios" | "error" | "duplicado_en_archivo";

export interface FilaResultado {
  fila: number;
  estado: EstadoFila;
  correo?: string;
  nombre?: string;
  cambios?: CambioCampo[];
  errores?: ErrorFila[];
  emprendedorId?: string; // solo si estado = actualizado
  datos?: FilaEmprendedorInput;
}

export interface ResultadoAnalisis {
  ok: boolean;
  errorGeneral?: string;
  totalFilas: number;
  nuevos: number;
  actualizados: number;
  sinCambios: number;
  errores: number;
  filas: FilaResultado[];
}

function celdaTexto(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text.trim();
    if ("result" in v) {
      const r = (v as { result?: unknown }).result;
      if (r instanceof Date) return r.toISOString().slice(0, 10);
      if (r !== undefined && r !== null) return String(r).trim();
    }
    return "";
  }
  return String(v).trim();
}

/**
 * Parsea + valida + calcula el diff contra la base de datos actual.
 * No modifica nada — es seguro llamarla tantas veces como se quiera.
 * Se usa tanto para el preview como, de nuevo, justo antes de aplicar en
 * confirmarImportacion (para que la importación sea idempotente incluso
 * si la BD cambió entre el preview y la confirmación).
 */
export async function analizarExcel(buffer: Buffer): Promise<ResultadoAnalisis> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return {
      ok: false,
      errorGeneral: "El archivo está corrupto o no es un .xlsx válido. Vuelve a exportarlo e intenta de nuevo.",
      totalFilas: 0,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: 0,
      filas: [],
    };
  }

  const hoja = workbook.getWorksheet(HOJA_EMPRENDEDORES);
  if (!hoja) {
    return {
      ok: false,
      errorGeneral: `No se encontró la hoja "${HOJA_EMPRENDEDORES}" en el archivo. Usa la plantilla oficial.`,
      totalFilas: 0,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: 0,
      filas: [],
    };
  }

  const filaEncabezados = hoja.getRow(1);
  const columnaPorNombre = new Map<string, number>();
  filaEncabezados.eachCell((cell, colNumber) => {
    const nombre = celdaTexto(cell);
    if (nombre) columnaPorNombre.set(nombre, colNumber);
  });

  const faltantes = COLUMNAS_REQUERIDAS.filter((c) => !columnaPorNombre.has(c));
  if (faltantes.length > 0) {
    return {
      ok: false,
      errorGeneral: `Faltan columnas obligatorias: ${faltantes.join(", ")}.`,
      totalFilas: 0,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: 0,
      filas: [],
    };
  }

  const colResponsable = columnaPorNombre.get(COLUMNA_OPCIONAL_RESPONSABLE);

  if (hoja.rowCount <= 1) {
    return {
      ok: true,
      totalFilas: 0,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: 0,
      filas: [],
    };
  }

  const filas: FilaResultado[] = [];
  const correosVistos = new Map<string, number>(); // correo -> primera fila donde aparece

  for (let fila = 2; fila <= hoja.rowCount; fila++) {
    const row = hoja.getRow(fila);
    // Fila completamente vacía: se ignora, no es un error.
    if (row.cellCount === 0 || row.values === undefined) continue;
    const vacia = COLUMNAS_REQUERIDAS.every((c) => celdaTexto(row.getCell(columnaPorNombre.get(c)!)) === "");
    if (vacia) continue;

    const crudo: Record<string, string> = {};
    for (const col of COLUMNAS_REQUERIDAS) {
      crudo[col] = celdaTexto(row.getCell(columnaPorNombre.get(col)!));
    }
    const responsableCrudo = colResponsable ? celdaTexto(row.getCell(colResponsable)) : "";

    const parsed = filaEmprendedorSchema.safeParse({
      nombre: crudo["Nombre"],
      emprendimiento: crudo["Emprendimiento"],
      sector: crudo["Sector"],
      etapa: crudo["Etapa_UIE"],
      estado: crudo["Estado"],
      fechaIngreso: crudo["Fecha_Ingreso"],
      correo: crudo["Correo"],
      telefono: crudo["Telefono"],
      responsable: responsableCrudo || undefined,
    });

    if (!parsed.success) {
      const columnaPorCampo: Record<string, string> = {
        nombre: "Nombre",
        emprendimiento: "Emprendimiento",
        sector: "Sector",
        etapa: "Etapa_UIE",
        estado: "Estado",
        fechaIngreso: "Fecha_Ingreso",
        correo: "Correo",
        telefono: "Telefono",
        responsable: COLUMNA_OPCIONAL_RESPONSABLE,
      };
      const valorPorCampo: Record<string, string> = {
        nombre: crudo["Nombre"],
        emprendimiento: crudo["Emprendimiento"],
        sector: crudo["Sector"],
        etapa: crudo["Etapa_UIE"],
        estado: crudo["Estado"],
        fechaIngreso: crudo["Fecha_Ingreso"],
        correo: crudo["Correo"],
        telefono: crudo["Telefono"],
        responsable: responsableCrudo,
      };

      const errores: ErrorFila[] = parsed.error.issues.map((issue) => {
        const campo = String(issue.path[0] ?? "");
        return {
          fila,
          columna: columnaPorCampo[campo] ?? (campo || "?"),
          valor: valorPorCampo[campo] ?? "",
          mensaje: issue.message,
        };
      });
      filas.push({ fila, estado: "error", errores });
      continue;
    }

    const correo = parsed.data.correo;
    if (correosVistos.has(correo)) {
      filas.push({
        fila,
        estado: "duplicado_en_archivo",
        correo,
        nombre: parsed.data.nombre,
        errores: [
          {
            fila,
            columna: "Correo",
            valor: correo,
            mensaje: `Correo duplicado dentro del archivo (también aparece en la fila ${correosVistos.get(correo)}).`,
          },
        ],
      });
      continue;
    }
    correosVistos.set(correo, fila);

    filas.push({ fila, estado: "nuevo", correo, nombre: parsed.data.nombre, datos: parsed.data });
  }

  // Match + diff contra la BD, solo para las filas que pasaron validación.
  const correosValidos = filas.filter((f) => f.datos).map((f) => f.correo!);
  const existentes = correosValidos.length
    ? await prisma.emprendedor.findMany({ where: { correo: { in: correosValidos } } })
    : [];
  const existentePorCorreo = new Map(existentes.map((e) => [e.correo, e]));

  const resueltas: FilaResultado[] = filas.map((f) => {
    if (!f.datos) return f;
    const actual = existentePorCorreo.get(f.correo!);

    if (!actual) {
      return { ...f, estado: "nuevo" };
    }

    const cambios: CambioCampo[] = [];
    for (const campo of CAMPOS_COMPARABLES) {
      const nuevoValor = String(f.datos[campo]);
      const anteriorValor =
        campo === "fechaIngreso" ? actual.fechaIngreso.toISOString().slice(0, 10) : String(actual[campo]);
      if (nuevoValor !== anteriorValor) {
        cambios.push({ campo, anterior: anteriorValor, nuevo: nuevoValor });
      }
    }

    return {
      ...f,
      estado: cambios.length > 0 ? "actualizado" : "sin_cambios",
      cambios,
      emprendedorId: actual.id,
    };
  });

  return {
    ok: true,
    totalFilas: resueltas.length,
    nuevos: resueltas.filter((f) => f.estado === "nuevo").length,
    actualizados: resueltas.filter((f) => f.estado === "actualizado").length,
    sinCambios: resueltas.filter((f) => f.estado === "sin_cambios").length,
    errores: resueltas.filter((f) => f.estado === "error" || f.estado === "duplicado_en_archivo").length,
    filas: resueltas,
  };
}
