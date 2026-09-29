import { prisma } from "../src/lib/prisma";
import type { Prisma } from "../src/generated/prisma/client";
import { FASES_SEED, ETAPAS_SEED, INSTRUMENTOS_SEED, REGLAS_AVANCE_SEED } from "./catalogoSeed";

function aJson(valor: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
}

export async function seedCatalogo() {
  console.log("Sembrando catálogo configurable (fases, etapas, instrumentos)...");

  const faseIdPorClave = new Map<string, string>();
  for (const f of FASES_SEED) {
    const fase = await prisma.fase.upsert({
      where: { clave: f.clave },
      update: { nombre: f.nombre, descripcion: f.descripcion, orden: f.orden },
      create: { clave: f.clave, nombre: f.nombre, descripcion: f.descripcion, orden: f.orden },
    });
    faseIdPorClave.set(f.clave, fase.id);
  }

  for (const e of ETAPAS_SEED) {
    await prisma.etapa.upsert({
      where: { clave: e.clave },
      update: { nombre: e.nombre, color: e.color, orden: e.orden },
      create: { clave: e.clave, nombre: e.nombre, color: e.color, orden: e.orden },
    });
  }

  for (const i of INSTRUMENTOS_SEED) {
    const faseId = faseIdPorClave.get(i.faseClave);
    await prisma.instrumento.upsert({
      where: { clave: i.clave },
      update: {
        nombre: i.nombre,
        proposito: i.proposito,
        origenManual: i.origenManual,
        faseId,
        momento: i.momento,
        responsableDiligencia: i.responsableDiligencia,
        responsableRevisa: i.responsableRevisa,
        orden: i.orden,
        permiteMultiples: i.permiteMultiples ?? false,
        transversal: i.transversal ?? false,
        camposSchema: aJson(i.campos),
      },
      create: {
        clave: i.clave,
        nombre: i.nombre,
        proposito: i.proposito,
        origenManual: i.origenManual,
        faseId,
        momento: i.momento,
        responsableDiligencia: i.responsableDiligencia,
        responsableRevisa: i.responsableRevisa,
        orden: i.orden,
        permiteMultiples: i.permiteMultiples ?? false,
        transversal: i.transversal ?? false,
        camposSchema: aJson(i.campos),
      },
    });
  }

  for (const r of REGLAS_AVANCE_SEED) {
    const faseOrigenId = faseIdPorClave.get(r.faseOrigenClave)!;
    const faseDestinoId = faseIdPorClave.get(r.faseDestinoClave)!;
    const existente = await prisma.reglaAvance.findFirst({
      where: { faseDestinoId, OR: [{ faseOrigenId }, { faseOrigenId: null }] },
    });
    if (existente) continue;
    await prisma.reglaAvance.create({
      data: { nombre: r.nombre, faseOrigenId, faseDestinoId, instrumentosClaves: aJson(r.instrumentosClaves) },
    });
  }

  console.log(
    `  ${FASES_SEED.length} fases, ${ETAPAS_SEED.length} etapas, ${INSTRUMENTOS_SEED.length} instrumentos listos en el catálogo.`
  );
}

if (require.main === module) {
  seedCatalogo()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
