import { z } from "zod";
import { ETAPAS, ESTADOS_EMPRENDEDOR } from "./emprendedor";

// Columnas de la hoja "Emprendedores" de la plantilla oficial
// (Plantilla_Proyecto_UIE_Cadena_Valor.xlsx). El importador solo toca
// campos maestros/administrativos — nunca historial (acompañamientos,
// compromisos, reuniones).
export const COLUMNAS_REQUERIDAS = [
  "Nombre",
  "Emprendimiento",
  "Sector",
  "Etapa_UIE",
  "Estado",
  "Fecha_Ingreso",
  "Correo",
  "Telefono",
] as const;

export const COLUMNA_OPCIONAL_RESPONSABLE = "Responsable";

export const filaEmprendedorSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre vacío"),
  emprendimiento: z.string().trim().min(1, "Emprendimiento vacío"),
  sector: z.string().trim().min(1, "Sector vacío"),
  etapa: z.enum(ETAPAS, { message: `Valor no reconocido. Valores permitidos: ${ETAPAS.join(", ")}` }),
  estado: z.enum(ESTADOS_EMPRENDEDOR, {
    message: `Valor no reconocido. Valores permitidos: ${ESTADOS_EMPRENDEDOR.join(", ")}`,
  }),
  fechaIngreso: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido, se espera AAAA-MM-DD"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  telefono: z.string().trim().min(1, "Teléfono vacío"),
  responsable: z.string().trim().optional(),
});

export type FilaEmprendedorInput = z.infer<typeof filaEmprendedorSchema>;

export const CAMPOS_COMPARABLES = [
  "nombre",
  "emprendimiento",
  "sector",
  "etapa",
  "estado",
  "fechaIngreso",
  "telefono",
] as const;
