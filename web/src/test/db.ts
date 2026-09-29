import { prisma } from "@/lib/prisma";

/** Deja test.db vacía antes de cada test — mismo orden de borrado que
 * prisma/seed.ts (hijos antes que padres, respetando FKs). */
export async function limpiarDb() {
  await prisma.auditLog.deleteMany();
  await prisma.compromiso.deleteMany();
  await prisma.acompanamiento.deleteMany();
  await prisma.reunion.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.instrumentoRespuesta.deleteMany();
  await prisma.reglaAvance.deleteMany();
  await prisma.solicitudRestablecimiento.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.integranteEquipo.deleteMany();
  await prisma.emprendedor.deleteMany();
  await prisma.usuario.deleteMany();
  // Catálogo (Fase/Etapa/Instrumento) — no lo borra el seed de dev
  // (upsert), pero los tests de integración sí necesitan partir de cero.
  await prisma.instrumento.deleteMany();
  await prisma.etapa.deleteMany();
  await prisma.fase.deleteMany();
  await prisma.cohorte.deleteMany();
}
