import { prisma } from "@/lib/prisma";

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
  await prisma.instrumento.deleteMany();
  await prisma.etapa.deleteMany();
  await prisma.fase.deleteMany();
  await prisma.cohorte.deleteMany();
}
