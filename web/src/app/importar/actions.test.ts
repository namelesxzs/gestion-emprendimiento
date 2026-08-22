import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { construirExcelEmprendedores } from "@/test/xlsx";

// vi.mock se hoistea sobre los imports; las variables que empiezan con
// "mock" están exentas de esa restricción, así que mockAuth puede
// referenciarse dentro de la factory sin problema.
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
// revalidatePath solo funciona dentro de una request real de Next.js — no
// es parte de la lógica bajo prueba aquí, así que se anula.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { confirmarImportacion } = await import("./actions");

const FILA_VALIDA = {
  Nombre: "Ana Gómez",
  Emprendimiento: "EcoBolsas",
  Sector: "Ambiental",
  Etapa_UIE: "Descubrir",
  Estado: "Activo",
  Fecha_Ingreso: "2026-01-15",
  Correo: "ana@test.com",
  Telefono: "3001111111",
};

async function crearAdminDeTest() {
  return prisma.usuario.create({
    data: { nombre: "Admin Test", correo: `admin-${Math.random()}@test.com`, passwordHash: "x", rol: "ADMINISTRADOR" },
  });
}

function sesionDe(usuario: { id: string; nombre: string }) {
  return { user: { id: usuario.id, rol: "ADMINISTRADOR" as const, emprendedorId: null, name: usuario.nombre } };
}

function formDataArchivo(base64: string, nombre = "test.xlsx") {
  const fd = new FormData();
  fd.set("archivoBase64", base64);
  fd.set("nombreArchivo", nombre);
  return fd;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("confirmarImportacion — autorización", () => {
  it("rechaza si el rol no es Administrador/Docente", async () => {
    mockAuth.mockResolvedValue({ user: { id: "x", rol: "COORDINADOR", emprendedorId: null } });

    const r = await confirmarImportacion({}, formDataArchivo(""));

    expect(r.error).toMatch(/No autorizado/);
    expect(await prisma.emprendedor.count()).toBe(0);
  });

  it("rechaza sin sesión", async () => {
    mockAuth.mockResolvedValue(null);

    const r = await confirmarImportacion({}, formDataArchivo(""));

    expect(r.error).toBeDefined();
  });
});

describe("confirmarImportacion — transacción", () => {
  it("crea el Emprendedor, marca el ImportRun como CONFIRMADO y deja auditoría con origen IMPORTACION_EXCEL", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionDe(admin));

    const buffer = await construirExcelEmprendedores([FILA_VALIDA]);
    const r = await confirmarImportacion({}, formDataArchivo(buffer.toString("base64")));

    expect(r.success).toBe(true);
    expect(r.resumen).toEqual({ nuevos: 1, actualizados: 0, sinCambios: 0, errores: 0 });

    const emprendedor = await prisma.emprendedor.findUnique({ where: { correo: "ana@test.com" } });
    expect(emprendedor).not.toBeNull();

    const importRun = await prisma.importRun.findFirst();
    expect(importRun?.estado).toBe("CONFIRMADO");
    expect(importRun?.usuarioId).toBe(admin.id);

    const auditLog = await prisma.auditLog.findFirst({ where: { entidad: "Emprendedor", accion: "CREATE" } });
    expect(auditLog?.origen).toBe("IMPORTACION_EXCEL");
    expect(auditLog?.usuarioId).toBe(admin.id);
  });

  it("reimportar el mismo archivo es idempotente — la segunda corrida no duplica ni vuelve a crear", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionDe(admin));

    const buffer = await construirExcelEmprendedores([FILA_VALIDA]);

    const primera = await confirmarImportacion({}, formDataArchivo(buffer.toString("base64")));
    const segunda = await confirmarImportacion({}, formDataArchivo(buffer.toString("base64")));

    expect(primera.resumen).toEqual({ nuevos: 1, actualizados: 0, sinCambios: 0, errores: 0 });
    expect(segunda.resumen).toEqual({ nuevos: 0, actualizados: 0, sinCambios: 1, errores: 0 });
    expect(await prisma.emprendedor.count()).toBe(1);
  });

  it("al actualizar un emprendedor existente nunca toca su historial de acompañamientos", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionDe(admin));

    const existente = await prisma.emprendedor.create({
      data: {
        nombre: "Ana Gómez",
        emprendimiento: "EcoBolsas",
        sector: "Ambiental",
        etapa: "Descubrir",
        estado: "Activo",
        fechaIngreso: new Date("2026-01-15T00:00:00"),
        correo: "ana@test.com",
        telefono: "3001111111",
      },
    });
    const acompanamiento = await prisma.acompanamiento.create({
      data: {
        emprendedorId: existente.id,
        fecha: new Date("2026-02-01T00:00:00"),
        etapa: "Descubrir",
        diagnostico: "Diagnóstico previo a la importación",
        recomendaciones: "—",
        avancePct: 20,
      },
    });

    const buffer = await construirExcelEmprendedores([{ ...FILA_VALIDA, Etapa_UIE: "Incubar" }]);
    const r = await confirmarImportacion({}, formDataArchivo(buffer.toString("base64")));

    expect(r.resumen).toEqual({ nuevos: 0, actualizados: 1, sinCambios: 0, errores: 0 });

    const acompanamientoIntacto = await prisma.acompanamiento.findUnique({ where: { id: acompanamiento.id } });
    expect(acompanamientoIntacto?.diagnostico).toBe("Diagnóstico previo a la importación");

    const actualizado = await prisma.emprendedor.findUnique({ where: { id: existente.id } });
    expect(actualizado?.etapa).toBe("Incubar");
  });
});
