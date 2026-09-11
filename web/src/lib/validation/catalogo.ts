import { z } from "zod";
import { TIPOS_CAMPO } from "@/lib/catalogo/tipos";

// Metadatos de Fase/Etapa/Instrumento editables desde /configuracion. La
// estructura de campos de un Instrumento (`camposSchema`) no se edita desde
// la UI todavía — viene sembrada desde el Manual (ver prisma/catalogoSeed.ts)
// y se ajusta por código si hace falta; lo que el Administrador controla en
// esta primera versión es qué está activo, el orden y los datos de
// presentación (nombre, propósito, momento, responsables, fase asociada).

export const editarFaseSchema = z.object({
  id: z.string().trim().min(1),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z.string().trim().optional(),
  orden: z.coerce.number().int(),
});
export type EditarFaseInput = z.infer<typeof editarFaseSchema>;

export const editarEtapaSchema = z.object({
  id: z.string().trim().min(1),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  orden: z.coerce.number().int(),
  faseId: z.string().trim().optional(),
});
export type EditarEtapaInput = z.infer<typeof editarEtapaSchema>;

export const editarInstrumentoSchema = z.object({
  id: z.string().trim().min(1),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  proposito: z.string().trim().min(1, "El propósito es obligatorio"),
  momento: z.string().trim().optional(),
  responsableDiligencia: z.string().trim().optional(),
  responsableRevisa: z.string().trim().optional(),
  faseId: z.string().trim().optional(),
  orden: z.coerce.number().int(),
});
export type EditarInstrumentoInput = z.infer<typeof editarInstrumentoSchema>;

export const toggleCatalogoSchema = z.object({
  id: z.string().trim().min(1),
});

export const crearReglaAvanceSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  faseOrigenId: z.string().trim().optional(),
  faseDestinoId: z.string().trim().min(1, "La fase destino es obligatoria"),
  // Viene del formulario como una lista de claves separadas por coma
  // (checkboxes serializados) — se valida que haya al menos una.
  instrumentosClaves: z
    .array(z.string().trim().min(1))
    .min(1, "Selecciona al menos un instrumento requerido"),
});
export type CrearReglaAvanceInput = z.infer<typeof crearReglaAvanceSchema>;

// --- Motor de formularios genérico (InstrumentoRespuesta) -----------------

export const campoRuntimeSchema = z.object({
  clave: z.string().trim().min(1),
  etiqueta: z.string().trim().min(1),
  tipo: z.enum(TIPOS_CAMPO),
  requerido: z.boolean().optional(),
  opciones: z.array(z.string()).optional(),
  ayuda: z.string().optional(),
});
export type CampoRuntime = z.infer<typeof campoRuntimeSchema>;

export const guardarRespuestaInstrumentoSchema = z.object({
  instrumentoId: z.string().trim().min(1),
  emprendedorId: z.string().trim().min(1),
});

/** Valida los valores capturados en un formulario contra el `camposSchema`
 * real del instrumento (los campos requeridos deben venir con contenido).
 * No se puede tipar de forma estática porque el esquema es dato, no código
 * — es el corazón del motor de formularios genérico (ver auditoría C3). */
export function validarDatosInstrumento(
  campos: CampoRuntime[],
  datos: Record<string, unknown>
): { ok: true; datos: Record<string, unknown> } | { ok: false; error: string } {
  const limpio: Record<string, unknown> = {};
  for (const campo of campos) {
    const valor = datos[campo.clave];
    if (campo.tipo === "booleano") {
      limpio[campo.clave] = valor === true || valor === "true" || valor === "on";
      continue;
    }
    const texto = typeof valor === "string" ? valor.trim() : valor;
    if (campo.requerido && (texto === undefined || texto === null || texto === "")) {
      return { ok: false, error: `El campo "${campo.etiqueta}" es obligatorio.` };
    }
    if (campo.tipo === "numero" && texto !== undefined && texto !== "" && texto !== null) {
      const n = Number(texto);
      if (Number.isNaN(n)) return { ok: false, error: `El campo "${campo.etiqueta}" debe ser numérico.` };
      limpio[campo.clave] = n;
      continue;
    }
    limpio[campo.clave] = texto ?? "";
  }
  return { ok: true, datos: limpio };
}
