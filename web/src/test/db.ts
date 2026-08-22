import { prisma } from "@/lib/prisma";

/** Deja test.db vacía antes de cada test — mismo orden de borrado que
 * prisma/seed.ts (hijos antes que padres, respetando FKs). */
export async function limpiarDb() {
  await prisma.auditLog.deleteMany();
  await prisma.compromiso.deleteMany();
  await prisma.acompanamiento.deleteMany();
  await prisma.reunion.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.emprendedor.deleteMany();
  await prisma.usuario.deleteMany();
}
