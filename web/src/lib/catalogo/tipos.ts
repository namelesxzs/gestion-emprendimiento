// Tipos del catálogo configurable (Fase, Etapa, Instrumento) — compartidos
// entre el seed (prisma/catalogoSeed.ts), las validaciones (Zod) y el motor
// de formularios genérico (InstrumentoForm). Ver auditoría §07/§08 (C1-C5).

export const TIPOS_CAMPO = ["texto", "textarea", "numero", "fecha", "seleccion", "booleano"] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

/** Definición de un campo dentro del `camposSchema` de un Instrumento. El
 * motor de formularios genérico (InstrumentoForm) dibuja el control
 * correspondiente a partir de esta descripción, sin necesitar una pantalla
 * propia por instrumento. */
export interface CampoInstrumentoDef {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  /** Solo para tipo "seleccion". */
  opciones?: string[];
  ayuda?: string;
}

export type CamposSchema = CampoInstrumentoDef[];
