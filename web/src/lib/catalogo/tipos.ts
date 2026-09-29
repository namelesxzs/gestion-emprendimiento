// Tipos del catálogo configurable (Fase, Etapa, Instrumento) — compartidos
// entre el seed (prisma/catalogoSeed.ts), las validaciones (Zod) y el motor
// de formularios genérico (InstrumentoForm). Ver auditoría §07/§08 (C1-C5).

export const TIPOS_CAMPO = [
  "texto",
  "textarea",
  "numero",
  "fecha",
  "seleccion",
  "booleano",
  // Tabla del Manual: filas fijas (criterios de una rúbrica, indicadores de
  // KPIs) o filas que agrega quien diligencia (integrantes, riesgos, hitos).
  "tabla",
  // Firma: nombre de quien firma + sello de usuario y fecha puesto por el
  // servidor — nunca por el cliente.
  "firma",
  // Total calculado en el servidor (ej. "Puntaje total, máx. 25" de 6.3).
  "total",
] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

/** Tipos permitidos dentro de una columna de `tabla`. */
export type TipoColumna = "texto" | "textarea" | "numero" | "fecha" | "seleccion";

export interface FilaFijaDef {
  clave: string;
  etiqueta: string;
  /** Texto de apoyo que el Manual trae junto al criterio (solo lectura). */
  descripcion?: string;
}

/** Quién puede poner una firma: "asesor" = Administrador o Docente;
 * "emprendedor" = el propio Emprendedor o el personal de la ruta a su nombre. */
export type Firmante = "asesor" | "emprendedor";

/** Definición de un campo dentro del `camposSchema` de un Instrumento. El
 * motor de formularios genérico (InstrumentoForm) dibuja el control
 * correspondiente a partir de esta descripción, sin necesitar una pantalla
 * propia por instrumento. */
export interface CampoInstrumentoDef {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  /** Solo para tipo "seleccion" (y columnas "seleccion"). */
  opciones?: string[];
  ayuda?: string;
  /** Rango para "numero" (ej. rúbricas 1-5, porcentaje 0-100). */
  min?: number;
  max?: number;
  /** Solo "tabla": columnas de cada fila. */
  columnas?: CampoInstrumentoDef[];
  /** Solo "tabla": filas fijas del Manual. Sin esto, las filas son libres. */
  filas?: FilaFijaDef[];
  /** Solo "tabla" libre: filas vacías a mostrar de entrada. */
  filasIniciales?: number;
  /** Solo "total": suma de una columna numérica de una tabla. */
  sumaDe?: { tabla: string; columna: string };
  /** Solo "firma". */
  firmante?: Firmante;
  /** Solo "seleccion": valor que habilita el avance de fase cuando el
   * instrumento es exigido por una ReglaAvance (ej. "Avanza a incubación"). */
  valorHabilitaAvance?: string;
}

export type CamposSchema = CampoInstrumentoDef[];

/** Valor guardado de un campo "firma". */
export interface FirmaValor {
  nombre: string;
  firmadoPorId: string;
  firmadoPorNombre: string;
  firmadoPorRol: string;
  fecha: string;
}

export type FilaTabla = Record<string, string | number>;
