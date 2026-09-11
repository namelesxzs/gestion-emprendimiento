import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { solicitarRestablecimiento } from "./actions";

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(async () => {
  await limpiarDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("solicitarRestablecimiento", () => {
  it("crea una solicitud Pendiente cuando el correo existe", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "U", correo: "u@test.com", passwordHash: "x", rol: "DOCENTE" },
    });

    const r = await solicitarRestablecimiento({}, fd({ correo: "u@test.com" }));

    expect(r.success).toBe(true);
    const solicitud = await prisma.solicitudRestablecimiento.findFirst({ where: { usuarioId: usuario.id } });
    expect(solicitud?.estado).toBe("Pendiente");
  });

  it("responde success sin crear nada cuando el correo no existe (anti-enumeración)", async () => {
    const r = await solicitarRestablecimiento({}, fd({ correo: "no-existe@test.com" }));

    expect(r.success).toBe(true);
    expect(await prisma.solicitudRestablecimiento.count()).toBe(0);
  });

  it("no duplica una solicitud si ya hay una Pendiente para el mismo usuario", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "U", correo: "u2@test.com", passwordHash: "x", rol: "DOCENTE" },
    });

    await solicitarRestablecimiento({}, fd({ correo: "u2@test.com" }));
    await solicitarRestablecimiento({}, fd({ correo: "u2@test.com" }));

    expect(await prisma.solicitudRestablecimiento.count({ where: { usuarioId: usuario.id } })).toBe(1);
  });

  it("rechaza un correo con formato inválido", async () => {
    const r = await solicitarRestablecimiento({}, fd({ correo: "no-es-un-correo" }));

    expect(r.error).toMatch(/inválido/);
  });
});
