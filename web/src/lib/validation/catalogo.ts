import { z } from "zod";
import type { CampoInstrumentoDef, FirmaValor } from "@/lib/catalogo/tipos";

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
  // Manual §5.6: "quién lo revisa y en qué plazo".
  plazoRevisionDias: z.coerce.number().int().min(1, "El plazo debe ser de al menos 1 día").max(365).optional(),
  permiteMultiples: z.boolean().optional(),
  transversal: z.boolean().optional(),
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

/** La forma de un campo es dato (vive en `Instrumento.camposSchema`), no
 * código — por eso el tipo es la misma definición que usa el seed. */
export type CampoRuntime = CampoInstrumentoDef;

export const guardarRespuestaInstrumentoSchema = z.object({
  instrumentoId: z.string().trim().min(1),
  emprendedorId: z.string().trim().min(1),
  // Presente al editar un registro puntual de un instrumento que admite
  // varios (bitácora por sesión, entrevistas, versiones del BMC...).
  respuestaId: z.string().trim().optional(),
});

export const revisarRespuestaInstrumentoSchema = z.object({
  respuestaId: z.string().trim().min(1),
  decision: z.enum(["Revisado", "Devuelto"]),
  comentario: z.string().trim().max(2000).optional(),
});

/** Nombre del control HTML de una celda de tabla. Filas fijas usan la clave
 * de la fila; filas libres, el índice. */
export function nombreCelda(campo: string, fila: string | number, columna: string) {
  return `${campo}__${fila}__${columna}`;
}

const vacio = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Pasa los valores crudos del FormData a la forma que espera
 * `validarDatosInstrumento` — tablas como arreglo de filas, firmas como
 * { nombre, confirmado }. */
export function extraerDatosFormulario(campos: CampoRuntime[], formData: FormData): Record<string, unknown> {
  const datos: Record<string, unknown> = {};
  for (const campo of campos) {
    if (campo.tipo === "booleano") {
      datos[campo.clave] = formData.get(campo.clave) === "on";
    } else if (campo.tipo === "firma") {
      datos[campo.clave] = {
        nombre: formData.get(campo.clave) ?? "",
        confirmado: formData.get(`${campo.clave}__confirmo`) === "on",
      };
    } else if (campo.tipo === "tabla") {
      const columnas = campo.columnas ?? [];
      if (campo.filas?.length) {
        datos[campo.clave] = campo.filas.map((f) => {
          const fila: Record<string, unknown> = { fila: f.clave };
          for (const col of columnas) fila[col.clave] = formData.get(nombreCelda(campo.clave, f.clave, col.clave));
          return fila;
        });
      } else {
        const indices = new Set<number>();
        const prefijo = `${campo.clave}__`;
        for (const key of formData.keys()) {
          if (!key.startsWith(prefijo)) continue;
          const idx = Number(key.slice(prefijo.length).split("__")[0]);
          if (Number.isInteger(idx)) indices.add(idx);
        }
        datos[campo.clave] = [...indices]
          .sort((a, b) => a - b)
          .map((i) => {
            const fila: Record<string, unknown> = {};
            for (const col of columnas) fila[col.clave] = formData.get(nombreCelda(campo.clave, i, col.clave));
            return fila;
          });
      }
    } else if (campo.tipo !== "total") {
      datos[campo.clave] = formData.get(campo.clave);
    }
  }
  return datos;
}

type ResultadoEscalar = { ok: true; valor: string | number } | { ok: false; error: string };

function validarEscalar(campo: CampoRuntime, valor: unknown, etiqueta: string): ResultadoEscalar {
  const texto = typeof valor === "string" ? valor.trim() : valor;
  if (vacio(texto)) {
    if (campo.requerido) return { ok: false, error: `El campo "${etiqueta}" es obligatorio.` };
    return { ok: true, valor: "" };
  }
  if (campo.tipo === "numero") {
    const n = Number(texto);
    if (Number.isNaN(n)) return { ok: false, error: `El campo "${etiqueta}" debe ser numérico.` };
    if (campo.min !== undefined && n < campo.min)
      return { ok: false, error: `El campo "${etiqueta}" debe ser mayor o igual a ${campo.min}.` };
    if (campo.max !== undefined && n > campo.max)
      return { ok: false, error: `El campo "${etiqueta}" debe ser menor o igual a ${campo.max}.` };
    return { ok: true, valor: n };
  }
  if (campo.tipo === "seleccion" && campo.opciones?.length && !campo.opciones.includes(String(texto))) {
    return { ok: false, error: `El valor de "${etiqueta}" no es una opción válida.` };
  }
  return { ok: true, valor: String(texto) };
}

/** Valida los valores capturados en un formulario contra el `camposSchema`
 * real del instrumento (los campos requeridos deben venir con contenido).
 * No se puede tipar de forma estática porque el esquema es dato, no código
 * — es el corazón del motor de formularios genérico (ver auditoría C3).
 * Las firmas se devuelven tal cual: sellarlas exige la sesión, y eso lo
 * hace la acción del servidor (ver `sellarFirmas`). */
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

    if (campo.tipo === "firma") {
      if (valor !== undefined) limpio[campo.clave] = valor;
      continue;
    }

    if (campo.tipo === "total") continue;

    if (campo.tipo === "tabla") {
      const columnas = campo.columnas ?? [];
      const filasCrudas = Array.isArray(valor) ? (valor as Record<string, unknown>[]) : [];
      const filas: Record<string, string | number>[] = [];
      for (const cruda of filasCrudas) {
        const filaFija = campo.filas?.find((f) => f.clave === cruda.fila);
        const libreVacia = !filaFija && columnas.every((c) => vacio(cruda[c.clave]));
        if (libreVacia) continue;

        const fila: Record<string, string | number> = filaFija ? { fila: filaFija.clave } : {};
        for (const col of columnas) {
          const etiqueta = `${campo.etiqueta} — ${filaFija ? `${filaFija.etiqueta}: ` : ""}${col.etiqueta}`;
          // En filas fijas, una columna requerida solo se exige si la tabla
          // completa es requerida (ej. los puntajes de la rúbrica).
          const exigir = Boolean(col.requerido && (filaFija ? campo.requerido : true));
          const r = validarEscalar({ ...col, requerido: exigir }, cruda[col.clave], etiqueta);
          if (!r.ok) return r;
          fila[col.clave] = r.valor;
        }
        filas.push(fila);
      }
      if (campo.requerido && !campo.filas?.length && filas.length === 0) {
        return { ok: false, error: `Agrega al menos una fila en "${campo.etiqueta}".` };
      }
      limpio[campo.clave] = filas;
      continue;
    }

    const r = validarEscalar(campo, valor, campo.etiqueta);
    if (!r.ok) return r;
    limpio[campo.clave] = r.valor;
  }

  // Totales: se calculan aquí (servidor), nunca se confía en el cliente.
  for (const campo of campos) {
    if (campo.tipo !== "total" || !campo.sumaDe) continue;
    const { tabla, columna } = campo.sumaDe;
    const filas = (limpio[tabla] as Record<string, unknown>[] | undefined) ?? [];
    limpio[campo.clave] = filas.reduce<number>((acc, f) => acc + (typeof f[columna] === "number" ? f[columna] : 0), 0);
  }

  return { ok: true, datos: limpio };
}

/** Rol del usuario → puede poner esta firma. El Administrador y el Docente
 * (asesor) firman como asesor; la firma del emprendedor la pone el propio
 * Emprendedor o el personal de la ruta transcribiendo una firma física. */
export function puedeFirmar(rol: string, firmante: CampoRuntime["firmante"]): boolean {
  if (rol === "ADMINISTRADOR" || rol === "DOCENTE") return true;
  if (rol === "EMPRENDEDOR") return firmante === "emprendedor";
  return false;
}

/** Sella las firmas con el usuario y la fecha del servidor. Una firma que el
 * usuario actual no puede poner (ej. la del asesor, vista por el
 * Emprendedor) conserva lo que ya había. Una firma sin cambios conserva su
 * sello original — editar otro campo no re-firma a nombre de otra persona. */
export function sellarFirmas(
  campos: CampoRuntime[],
  datos: Record<string, unknown>,
  previos: Record<string, unknown> | null,
  usuario: { id: string; nombre: string; rol: string },
  ahora: Date = new Date()
): { ok: true; datos: Record<string, unknown> } | { ok: false; error: string } {
  const salida = { ...datos };
  for (const campo of campos) {
    if (campo.tipo !== "firma") continue;
    const previa = (previos?.[campo.clave] ?? null) as FirmaValor | null;
    const entrada = (datos[campo.clave] ?? {}) as { nombre?: unknown; confirmado?: unknown };
    const nombre = typeof entrada.nombre === "string" ? entrada.nombre.trim() : "";

    if (!puedeFirmar(usuario.rol, campo.firmante)) {
      if (previa) salida[campo.clave] = previa;
      else delete salida[campo.clave];
      continue;
    }

    if (!nombre) {
      if (campo.requerido) return { ok: false, error: `Falta la firma: "${campo.etiqueta}".` };
      delete salida[campo.clave];
      continue;
    }

    if (previa && previa.nombre === nombre) {
      salida[campo.clave] = previa;
      continue;
    }

    if (entrada.confirmado !== true) {
      return { ok: false, error: `Para firmar "${campo.etiqueta}" marca la casilla de confirmación de firma.` };
    }

    const firma: FirmaValor = {
      nombre,
      firmadoPorId: usuario.id,
      firmadoPorNombre: usuario.nombre,
      firmadoPorRol: usuario.rol,
      fecha: ahora.toISOString(),
    };
    salida[campo.clave] = firma;
  }
  return { ok: true, datos: salida };
}
