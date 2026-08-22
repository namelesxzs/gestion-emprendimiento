import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { registrarIntentoLogin } from "@/lib/loginRateLimit";

const mockSignIn = vi.fn();
vi.mock("@/auth", () => ({ signIn: (...args: unknown[]) => mockSignIn(...args) }));
// El paquete real "next-auth" importa "next/server", que no resuelve fuera
// del runtime de Next — se stubea solo la clase que actions.ts usa (AuthError).
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const { authenticate } = await import("./actions");

function formDataCredenciales(correo: string, password: string) {
  const fd = new FormData();
  fd.set("correo", correo);
  fd.set("password", password);
  return fd;
}

beforeEach(async () => {
  await prisma.loginAttempt.deleteMany();
  mockSignIn.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authenticate — gate de rate limit", () => {
  it("llama a signIn normalmente cuando no hay bloqueo", async () => {
    mockSignIn.mockResolvedValue(undefined);

    const r = await authenticate({}, formDataCredenciales("libre@test.com", "lo-que-sea"));

    expect(mockSignIn).toHaveBeenCalledOnce();
    expect(r.success).toBe(true);
  });

  it("bloquea tras 5 intentos fallidos y NUNCA llega a llamar signIn (ni con la contraseña correcta)", async () => {
    for (let i = 0; i < 5; i++) await registrarIntentoLogin("bloqueado@test.com", false);

    const r = await authenticate({}, formDataCredenciales("bloqueado@test.com", "esta-si-es-la-correcta"));

    expect(mockSignIn).not.toHaveBeenCalled();
    expect(r.error).toMatch(/Demasiados intentos/);
  });

  it("el bloqueo es por correo — otro correo no se ve afectado", async () => {
    for (let i = 0; i < 5; i++) await registrarIntentoLogin("bloqueado2@test.com", false);
    mockSignIn.mockResolvedValue(undefined);

    const r = await authenticate({}, formDataCredenciales("nuevo@test.com", "cualquier-cosa"));

    expect(mockSignIn).toHaveBeenCalledOnce();
    expect(r.success).toBe(true);
  });
});
