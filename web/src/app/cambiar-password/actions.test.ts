import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

const { cambiarPasswordPropio } = await import("./actions");

async function crearUsuarioDeTest(debeCambiarPassword = true) {
  const passwordHash = await bcrypt.hash("temporal123", 10);
  return prisma.usuario.create({
    data: {
      nombre: "Usuario Test",
      correo: `u-${Math.random()}@test.com`,
      passwordHash,
      rol: "DOCENTE",
      debeCambiarPassword,
    },
  });
}

function sesion(usuario: { id: string; nombre: string }) {
  return { user: { id: usuario.id, rol: "DOCENTE" as const, emprendedorId: null, name: usuario.nombre } };
}

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("cambiarPasswordPropio", () => {
  it("actualiza la contraseña propia y desactiva debeCambiarPassword", async () => {
    const usuario = await crearUsuarioDeTest(true);
    mockAuth.mockResolvedValue(sesion(usuario));

    const r = await cambiarPasswordPropio({}, fd({ nuevaPassword: "nueva1234", confirmar: "nueva1234" }));

    expect(r.success).toBe(true);
    const actualizado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    expect(actualizado?.debeCambiarPassword).toBe(false);
    expect(await bcrypt.compare("nueva1234", actualizado!.passwordHash)).toBe(true);
  });

  it("rechaza una contraseña de menos de 8 caracteres", async () => {
    const usuario = await crearUsuarioDeTest();
    mockAuth.mockResolvedValue(sesion(usuario));

    const r = await cambiarPasswordPropio({}, fd({ nuevaPassword: "corta", confirmar: "corta" }));

    expect(r.error).toMatch(/al menos 8/);
  });

  it("rechaza si las contraseñas no coinciden", async () => {
    const usuario = await crearUsuarioDeTest();
    mockAuth.mockResolvedValue(sesion(usuario));

    const r = await cambiarPasswordPropio({}, fd({ nuevaPassword: "nueva1234", confirmar: "otra1234" }));

    expect(r.error).toMatch(/no coinciden/);
  });

  it("rechaza si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null);

    const r = await cambiarPasswordPropio({}, fd({ nuevaPassword: "nueva1234", confirmar: "nueva1234" }));

    expect(r.error).toMatch(/No autenticado/);
  });
});
