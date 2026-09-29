import { prisma } from "@/lib/prisma";

const VENTANA_MINUTOS = 15;
const MAX_INTENTOS_FALLIDOS = 5;
const RETENCION_HORAS = 24;

function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export async function loginBloqueado(correo: string): Promise<boolean> {
  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60 * 1000);
  const fallidos = await prisma.loginAttempt.count({
    where: { correo: normalizarCorreo(correo), exitoso: false, createdAt: { gte: desde } },
  });
  return fallidos >= MAX_INTENTOS_FALLIDOS;
}

export async function registrarIntentoLogin(correo: string, exitoso: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { correo: normalizarCorreo(correo), exitoso } });

  const limite = new Date(Date.now() - RETENCION_HORAS * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: limite } } });
}

export const MINUTOS_BLOQUEO = VENTANA_MINUTOS;
