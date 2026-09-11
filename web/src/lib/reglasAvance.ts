import { prisma } from "@/lib/prisma";

/**
 * Verifica si un emprendedor puede pasar de `faseOrigenId` a `faseDestinoId`
 * según las reglas de avance configuradas (ver auditoría §07/§08, C4 — motor
 * de catálogo). Sin reglas activas para esa transición, el paso queda libre:
 * el gate solo existe cuando el Administrador lo configura explícitamente.
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
      select: { id: true, clave: true, nombre: true },
    });

    const respuestas = await prisma.instrumentoRespuesta.findMany({
      where: { emprendedorId, instrumentoId: { in: instrumentos.map((i) => i.id) } },
      select: { instrumentoId: true },
    });
    const idsConRespuesta = new Set(respuestas.map((r) => r.instrumentoId));

    const faltantes = instrumentos.filter((i) => !idsConRespuesta.has(i.id));
    if (faltantes.length > 0) {
      return {
        ok: false,
        error: `La regla "${regla.nombre}" exige diligenciar antes: ${faltantes.map((i) => i.nombre).join(", ")}.`,
      };
    }
  }

  return { ok: true };
}
