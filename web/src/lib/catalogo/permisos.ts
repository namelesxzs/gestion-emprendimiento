import type { Rol } from "@/types/next-auth";

export function puedeDiligenciarInstrumento(rol: Rol, responsableDiligencia: string | null): boolean {
  if (rol === "ADMINISTRADOR" || rol === "DOCENTE") return true;
  if (rol === "COORDINADOR") return false;
  if (!responsableDiligencia) return false;
  return responsableDiligencia.toLowerCase().includes("emprendedor");
}

export function puedeRevisarInstrumento(rol: Rol, responsableRevisa: string | null): boolean {
  if (rol === "ADMINISTRADOR") return true;
  if (rol === "EMPRENDEDOR" || !responsableRevisa) return false;
  const texto = responsableRevisa.toLowerCase();
  if (rol === "DOCENTE") return texto.includes("asesor") || texto.includes("docente");
  return texto.includes("coordinador");
}
