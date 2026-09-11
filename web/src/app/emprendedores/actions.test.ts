import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { editarEmprendedor } = await import("./actions");

async function crearEmprendedorDeTest(etapa = "Descubrir") {
  return prisma.emprendedor.create({
    data: {
      nombre: "Emprendedor Test",
      emprendimiento: "Negocio",
      sector: "Sector",
      etapa,
      estado: "Activo",
      fechaIngreso: new Date("2026-01-01"),
      correo: `emp-${Math.random()}@test.com`,
      telefono: "3000000000",
    },
  });
}

function sesionDocente() {
  return { user: { id: "docente-1", rol: "DOCENTE" as const, emprendedorId: null, name: "Docente" } };
}

function fdEditar(emprendedor: { id: string; nombre: string; emprendimiento: string; sector: string; estado: string; correo: string; telefono: string }, etapa: string) {
  const fd = new FormData();
  fd.set("id", emprendedor.id);
  fd.set("nombre", emprendedor.nombre);
  fd.set("emprendimiento", emprendedor.emprendimiento);
  fd.set("sector", emprendedor.sector);
  fd.set("etapa", etapa);
  fd.set("estado", emprendedor.estado);
  fd.set("fechaIngreso", "2026-01-01");
  fd.set("correo", emprendedor.correo);
  fd.set("telefono", emprendedor.telefono);
  return fd;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
  mockAuth.mockResolvedValue(sesionDocente());
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("editarEmprendedor — sustento documental por etapa", () => {
  it("bloquea avanzar de etapa si no hay documento aprobado para la etapa actual", async () => {
    const emprendedor = await crearEmprendedorDeTest("Descubrir");

    const r = await editarEmprendedor({}, fdEditar(emprendedor, "Incubar"));

    expect(r.error).toMatch(/documento aprobado/);
    const sinCambios = await prisma.emprendedor.findUnique({ where: { id: emprendedor.id } });
    expect(sinCambios?.etapa).toBe("Descubrir");
  });

  it("permite avanzar de etapa cuando hay un documento aprobado para la etapa actual", async () => {
    const emprendedor = await crearEmprendedorDeTest("Descubrir");
    const cuenta = await prisma.usuario.create({
      data: { nombre: "Docente", correo: `docente-${Math.random()}@test.com`, passwordHash: "x", rol: "DOCENTE" },
    });
    await prisma.documento.create({
      data: {
        emprendedorId: emprendedor.id,
        etapa: "Descubrir",
        nombreArchivo: "a.pdf",
        storagePath: "/tmp/a.pdf",
        mimeType: "application/pdf",
        tamanoBytes: 10,
        subidoPorId: cuenta.id,
        estado: "Aprobado",
      },
    });

    const r = await editarEmprendedor({}, fdEditar(emprendedor, "Incubar"));

    expect(r.success).toBe(true);
    const actualizado = await prisma.emprendedor.findUnique({ where: { id: emprendedor.id } });
    expect(actualizado?.etapa).toBe("Incubar");
  });

  it("no exige documento para corregir datos sin avanzar de etapa", async () => {
    const emprendedor = await crearEmprendedorDeTest("Formar");

    const r = await editarEmprendedor(
      {},
      fdEditar({ ...emprendedor, nombre: "Nombre corregido" }, "Formar")
    );

    expect(r.success).toBe(true);
    const actualizado = await prisma.emprendedor.findUnique({ where: { id: emprendedor.id } });
    expect(actualizado?.nombre).toBe("Nombre corregido");
  });

  it("no exige documento para retroceder de etapa", async () => {
    const emprendedor = await crearEmprendedorDeTest("Formar");

    const r = await editarEmprendedor({}, fdEditar(emprendedor, "Incubar"));

    expect(r.success).toBe(true);
    const actualizado = await prisma.emprendedor.findUnique({ where: { id: emprendedor.id } });
    expect(actualizado?.etapa).toBe("Incubar");
  });
});
