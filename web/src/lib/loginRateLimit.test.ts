import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { loginBloqueado, registrarIntentoLogin } from "./loginRateLimit";

beforeEach(async () => {
  await limpiarDb();
  await prisma.loginAttempt.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("loginBloqueado", () => {
  it("no bloquea un correo sin intentos previos", async () => {
    expect(await loginBloqueado("nadie@test.com")).toBe(false);
  });

  it("bloquea tras 5 intentos fallidos dentro de la ventana", async () => {
    for (let i = 0; i < 4; i++) await registrarIntentoLogin("victima@test.com", false);
    expect(await loginBloqueado("victima@test.com")).toBe(false);

    await registrarIntentoLogin("victima@test.com", false);
    expect(await loginBloqueado("victima@test.com")).toBe(true);
  });

  it("los intentos exitosos no cuentan para el bloqueo", async () => {
    for (let i = 0; i < 10; i++) await registrarIntentoLogin("usuario@test.com", true);
    expect(await loginBloqueado("usuario@test.com")).toBe(false);
  });

  it("no mezcla el contador entre correos distintos", async () => {
    for (let i = 0; i < 5; i++) await registrarIntentoLogin("a@test.com", false);
    expect(await loginBloqueado("a@test.com")).toBe(true);
    expect(await loginBloqueado("b@test.com")).toBe(false);
  });

  it("normaliza mayúsculas/espacios — el bloqueo aplica igual sin importar cómo se escriba el correo", async () => {
    for (let i = 0; i < 5; i++) await registrarIntentoLogin("Ana@Test.com", false);
    expect(await loginBloqueado("  ana@test.com  ")).toBe(true);
  });

  it("ignora intentos fuera de la ventana de 15 minutos", async () => {
    const viejo = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.loginAttempt.createMany({
      data: Array.from({ length: 5 }, () => ({ correo: "expirado@test.com", exitoso: false, createdAt: viejo })),
    });

    expect(await loginBloqueado("expirado@test.com")).toBe(false);
  });
});

describe("registrarIntentoLogin — limpieza de intentos viejos", () => {
  it("borra intentos de hace más de 24 horas al registrar uno nuevo", async () => {
    const viejo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await prisma.loginAttempt.create({ data: { correo: "viejo@test.com", exitoso: false, createdAt: viejo } });

    await registrarIntentoLogin("otro@test.com", true);

    expect(await prisma.loginAttempt.findFirst({ where: { correo: "viejo@test.com" } })).toBeNull();
  });
});
