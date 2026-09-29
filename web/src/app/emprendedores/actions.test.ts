import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { editarEmprendedor, agregarIntegranteEquipo, eliminarIntegranteEquipo } = await import("./actions");

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

async function sesionDocenteReal() {
  const docente = await prisma.usuario.create({
    data: { nombre: "Docente Real", correo: `docente-real-${Math.random()}@test.com`, passwordHash: "x", rol: "DOCENTE" },
  });
  mockAuth.mockResolvedValue({ user: { id: docente.id, rol: "DOCENTE" as const, emprendedorId: null, name: docente.nombre } });
  return docente;
}

describe("agregarIntegranteEquipo / eliminarIntegranteEquipo (Manual 6.1)", () => {
  it("agrega un integrante y lo audita", async () => {
    await sesionDocenteReal();
    const emprendedor = await crearEmprendedorDeTest();

    const fd = new FormData();
    fd.set("emprendedorId", emprendedor.id);
    fd.set("nombre", "María Pérez");
    fd.set("rolEquipo", "CTO");
    fd.set("programaAcademico", "Ingeniería de Sistemas");

    const r = await agregarIntegranteEquipo({}, fd);

    expect(r.success).toBe(true);
    const integrantes = await prisma.integranteEquipo.findMany({ where: { emprendedorId: emprendedor.id } });
    expect(integrantes).toHaveLength(1);
    expect(integrantes[0].nombre).toBe("María Pérez");
    expect(integrantes[0].rolEquipo).toBe("CTO");

    const auditLog = await prisma.auditLog.findFirst({
      where: { entidad: "IntegranteEquipo", accion: "CREATE" },
    });
    expect(auditLog).not.toBeNull();
  });

  it("rechaza un integrante sin nombre", async () => {
    const emprendedor = await crearEmprendedorDeTest();

    const fd = new FormData();
    fd.set("emprendedorId", emprendedor.id);
    fd.set("nombre", "   ");

    const r = await agregarIntegranteEquipo({}, fd);

    expect(r.error).toBeTruthy();
    const integrantes = await prisma.integranteEquipo.findMany({ where: { emprendedorId: emprendedor.id } });
    expect(integrantes).toHaveLength(0);
  });

  it("elimina un integrante existente y lo audita", async () => {
    await sesionDocenteReal();
    const emprendedor = await crearEmprendedorDeTest();
    const integrante = await prisma.integranteEquipo.create({
      data: { emprendedorId: emprendedor.id, nombre: "Juan Gómez" },
    });

    const fd = new FormData();
    fd.set("id", integrante.id);

    const r = await eliminarIntegranteEquipo({}, fd);

    expect(r.success).toBe(true);
    expect(await prisma.integranteEquipo.findUnique({ where: { id: integrante.id } })).toBeNull();

    const auditLog = await prisma.auditLog.findFirst({
      where: { entidad: "IntegranteEquipo", accion: "DELETE" },
    });
    expect(auditLog).not.toBeNull();
  });
});
