import type { Rol } from "@/types/next-auth";

/**
 * Quién puede diligenciar un Instrumento — respeta el actor que estipula el
 * propio Manual en su columna "responsable de diligenciar" (ver
 * `responsableDiligencia` en Instrumento), no solo un permiso genérico por
 * rol. Se usa tanto en el cliente (qué botón mostrar) como en el servidor
 * (`guardarRespuestaInstrumento`) — la verificación real es la del servidor.
 *
 * Reglas:
 * - Administrador: siempre puede, es la supervisión de toda la plataforma.
 * - Docente (asesor): el Manual lo nombra como responsable en casi todos los
 *   instrumentos, directa o indirectamente ("con el asesor", "Asesor",
 *   "Jurado / asesor evaluador") — conserva el mismo acceso amplio que ya
 *   tiene sobre el resto de los datos del emprendedor.
 * - Coordinador: solo consulta indicadores, nunca diligencia (RF13).
 * - Emprendedor: solo los instrumentos donde el Manual lo nombra a él como
 *   responsable — se detecta por texto en `responsableDiligencia` porque el
 *   Manual lo describe en prosa ("Emprendedor", "Emprendedor, con el
 *   asesor"), no con un enum cerrado.
 */
export function puedeDiligenciarInstrumento(rol: Rol, responsableDiligencia: string | null): boolean {
  if (rol === "ADMINISTRADOR" || rol === "DOCENTE") return true;
  if (rol === "COORDINADOR") return false;
  // EMPRENDEDOR
  if (!responsableDiligencia) return false;
  return responsableDiligencia.toLowerCase().includes("emprendedor");
}

/**
 * Quién puede revisar un registro diligenciado (Manual §5.6: "quién lo
 * revisa y en qué plazo") — mismo criterio por texto que el de diligenciar,
 * sobre `responsableRevisa`. El Administrador siempre puede; el Docente
 * cuando el Manual nombra al asesor; el Coordinador cuando lo nombra a él
 * (revisar no es diligenciar: no cambia su rol de consulta sobre los datos).
 * El Emprendedor nunca revisa sus propios formatos.
 */
export function puedeRevisarInstrumento(rol: Rol, responsableRevisa: string | null): boolean {
  if (rol === "ADMINISTRADOR") return true;
  if (rol === "EMPRENDEDOR" || !responsableRevisa) return false;
  const texto = responsableRevisa.toLowerCase();
  if (rol === "DOCENTE") return texto.includes("asesor") || texto.includes("docente");
  return texto.includes("coordinador");
}
