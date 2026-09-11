// Siembra idempotente del catálogo configurable (Fase 11 — ver auditoría
// §07/§08). A diferencia del resto de `seed.ts` (datos de ejemplo que se
// borran y recrean en cada corrida), el catálogo es configuración: se
// siembra con `upsert` por `clave` para no perder lo que el Administrador
// ya haya activado/desactivado o editado desde /configuracion.

import { prisma } from "../src/lib/prisma";
import { FASES_SEED, ETAPAS_SEED, INSTRUMENTOS_SEED } from "./catalogoSeed";

// Prisma tipa los campos Json contra InputJsonObject (exige índice de
// string) — CampoInstrumentoDef[] es estructuralmente JSON válido pero no
// calza con ese tipo nominal. Un roundtrip por JSON lo deja como `any`, que
// Prisma sí acepta para un campo Json.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aJson(valor: unknown): any {
  return JSON.parse(JSON.stringify(valor));
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
        camposSchema: aJson(i.campos),
      },
    });
  }

  console.log(
    `  ${FASES_SEED.length} fases, ${ETAPAS_SEED.length} etapas, ${INSTRUMENTOS_SEED.length} instrumentos listos en el catálogo.`
  );
}

// Permite correrlo suelto: `tsx prisma/seedCatalogo.ts` — útil si algún día
// se necesita re-sembrar el catálogo sin tocar los datos de ejemplo.
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
