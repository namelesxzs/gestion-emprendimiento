import { prisma } from "@/lib/prisma";
import type { CampoInstrumentoDef } from "@/lib/catalogo/tipos";

/**
 * Qué le falta a la última respuesta de un instrumento-gate para habilitar el
 * avance (Manual §5.2: "diligenciado y firmado por el asesor"). Se evalúa
 * contra el propio `camposSchema`: una selección con `valorHabilitaAvance`
 * debe tener ese valor, y toda firma requerida debe estar puesta. Devuelve
 * null si la respuesta habilita el avance.
 */
export function motivoGateNoCumplido(
  campos: CampoInstrumentoDef[],
  datos: Record<string, unknown>
): string | null {
  for (const campo of campos) {
    if (campo.tipo === "seleccion" && campo.valorHabilitaAvance && datos[campo.clave] !== campo.valorHabilitaAvance) {
      const actual = typeof datos[campo.clave] === "string" && datos[campo.clave] ? `"${datos[campo.clave]}"` : "sin decisión";
      return `la última evaluación registra ${actual} en "${campo.etiqueta}" (se requiere "${campo.valorHabilitaAvance}")`;
    }
    if (campo.tipo === "firma" && campo.requerido) {
      const firma = datos[campo.clave] as { nombre?: string } | undefined;
      if (!firma?.nombre) return `falta la firma "${campo.etiqueta}"`;
    }
  }
  return null;
}

/**
 * Verifica si un emprendedor puede pasar de `faseOrigenId` a `faseDestinoId`
 * según las reglas de avance configuradas (ver auditoría §07/§08, C4 — motor
 * de catálogo). Sin reglas activas para esa transición, el paso queda libre.
 * Con una regla, cada instrumento exigido debe tener una respuesta, y la más
 * reciente debe cumplir el gate (ver `motivoGateNoCumplido`).
 */
export async function verificarReglaAvance(
  emprendedorId: string,
  faseOrigenId: string | null,
  faseDestinoId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reglas = await prisma.reglaAvance.findMany({
    where: {
      activa: true,
      faseDestinoId,
      OR: [{ faseOrigenId: null }, { faseOrigenId }],
    },
  });

  if (reglas.length === 0) return { ok: true };

  for (const regla of reglas) {
    const clavesRequeridas = (regla.instrumentosClaves as unknown as string[]) ?? [];
    if (clavesRequeridas.length === 0) continue;

    const instrumentos = await prisma.instrumento.findMany({
      where: { clave: { in: clavesRequeridas } },
      select: { id: true, clave: true, nombre: true, camposSchema: true },
    });

    const respuestas = await prisma.instrumentoRespuesta.findMany({
      where: { emprendedorId, instrumentoId: { in: instrumentos.map((i) => i.id) } },
      select: { instrumentoId: true, datos: true },
      orderBy: { updatedAt: "desc" },
    });
    const ultimaPorInstrumento = new Map<string, Record<string, unknown>>();
    for (const r of respuestas) {
      if (!ultimaPorInstrumento.has(r.instrumentoId)) {
        ultimaPorInstrumento.set(r.instrumentoId, (r.datos as Record<string, unknown>) ?? {});
      }
    }

    const faltantes = instrumentos.filter((i) => !ultimaPorInstrumento.has(i.id));
    if (faltantes.length > 0) {
      return {
        ok: false,
        error: `La regla "${regla.nombre}" exige diligenciar antes: ${faltantes.map((i) => i.nombre).join(", ")}.`,
      };
    }

    for (const inst of instrumentos) {
      const campos = (inst.camposSchema as unknown as CampoInstrumentoDef[]) ?? [];
      const motivo = motivoGateNoCumplido(campos, ultimaPorInstrumento.get(inst.id)!);
      if (motivo) {
        return { ok: false, error: `La regla "${regla.nombre}" no se cumple en "${inst.nombre}": ${motivo}.` };
      }
    }
  }

  return { ok: true };
}
