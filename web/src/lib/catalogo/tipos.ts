export const TIPOS_CAMPO = [
  "texto",
  "textarea",
  "numero",
  "fecha",
  "seleccion",
  "booleano",
  "tabla",
  "firma",
  "total",
] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

export type TipoColumna = "texto" | "textarea" | "numero" | "fecha" | "seleccion";

export interface FilaFijaDef {
  clave: string;
  etiqueta: string;
  descripcion?: string;
}

export type Firmante = "asesor" | "emprendedor";

export interface CampoInstrumentoDef {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: string[];
  ayuda?: string;
  min?: number;
  max?: number;
  columnas?: CampoInstrumentoDef[];
  filas?: FilaFijaDef[];
  filasIniciales?: number;
  sumaDe?: { tabla: string; columna: string };
  firmante?: Firmante;
  valorHabilitaAvance?: string;
}

export type CamposSchema = CampoInstrumentoDef[];

export interface FirmaValor {
  nombre: string;
  firmadoPorId: string;
  firmadoPorNombre: string;
  firmadoPorRol: string;
  fecha: string;
}

export type FilaTabla = Record<string, string | number>;
