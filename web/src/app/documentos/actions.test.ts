import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { subirDocumento, revisarDocumento } = await import("./actions");

async function crearEmprendedorDeTest(etapa = "Descubrir") {
  return prisma.emprendedor.create({
    data: {
      nombre: "Emprendedor Test",
      emprendimiento: "Negocio",
      sector: "Sector",
      etapa,
      estado: "Activo",
      fechaIngreso: new Date(),
      correo: `emp-${Math.random()}@test.com`,
      telefono: "3000000000",
    },
  });
}

async function crearDocenteDeTest() {
  return prisma.usuario.create({
    data: { nombre: "Docente Test", correo: `docente-${Math.random()}@test.com`, passwordHash: "x", rol: "DOCENTE" },
  });
}

async function crearCuentaEmprendedor(emprendedorId: string) {
  return prisma.usuario.create({
    data: {
      nombre: "Cuenta Emprendedor",
      correo: `cuenta-${Math.random()}@test.com`,
      passwordHash: "x",
      rol: "EMPRENDEDOR",
      emprendedorId,
    },
  });
}

function sesionEmprendedor(usuario: { id: string; nombre: string }, emprendedorId: string) {
  return { user: { id: usuario.id, rol: "EMPRENDEDOR" as const, emprendedorId, name: usuario.nombre } };
}

function sesionDocente(usuario: { id: string; nombre: string }) {
  return { user: { id: usuario.id, rol: "DOCENTE" as const, emprendedorId: null, name: usuario.nombre } };
}

function fdConArchivo(emprendedorId: string, archivo: File) {
  const fd = new FormData();
  fd.set("emprendedorId", emprendedorId);
  fd.set("archivo", archivo);
  return fd;
}

function pdfDeTest(nombre = "soporte.pdf") {
  return new File([new Uint8Array([1, 2, 3])], nombre, { type: "application/pdf" });
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("subirDocumento", () => {
  it("el emprendedor sube un documento para sí mismo y queda Pendiente", async () => {
    const emprendedor = await crearEmprendedorDeTest("Descubrir");
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    mockAuth.mockResolvedValue(sesionEmprendedor(cuenta, emprendedor.id));

    const r = await subirDocumento({}, fdConArchivo(emprendedor.id, pdfDeTest()));

    expect(r.success).toBe(true);
    const documentos = await prisma.documento.findMany({ where: { emprendedorId: emprendedor.id } });
    expect(documentos).toHaveLength(1);
    expect(documentos[0].estado).toBe("Pendiente");
    expect(documentos[0].etapa).toBe("Descubrir");
    expect(documentos[0].subidoPorId).toBe(cuenta.id);
  });

  it("rechaza que un emprendedor suba documentos a nombre de otro emprendedor", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const otro = await crearEmprendedorDeTest();
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    mockAuth.mockResolvedValue(sesionEmprendedor(cuenta, emprendedor.id));

    const r = await subirDocumento({}, fdConArchivo(otro.id, pdfDeTest()));

    expect(r.error).toMatch(/No autorizado/);
    expect(await prisma.documento.count()).toBe(0);
  });

  it("un docente puede subir un documento en nombre de cualquier emprendedor", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const docente = await crearDocenteDeTest();
    mockAuth.mockResolvedValue(sesionDocente(docente));

    const r = await subirDocumento({}, fdConArchivo(emprendedor.id, pdfDeTest()));

    expect(r.success).toBe(true);
    expect(await prisma.documento.count()).toBe(1);
  });

  it("rechaza un tipo de archivo no permitido", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    mockAuth.mockResolvedValue(sesionEmprendedor(cuenta, emprendedor.id));

    const archivoInvalido = new File([new Uint8Array([1])], "virus.exe", { type: "application/x-msdownload" });
    const r = await subirDocumento({}, fdConArchivo(emprendedor.id, archivoInvalido));

    expect(r.error).toMatch(/no permitido/);
    expect(await prisma.documento.count()).toBe(0);
  });
});

describe("revisarDocumento", () => {
  it("un docente aprueba un documento y queda registrada la auditoría", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const docente = await crearDocenteDeTest();
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    const documento = await prisma.documento.create({
      data: {
        emprendedorId: emprendedor.id,
        etapa: emprendedor.etapa,
        nombreArchivo: "a.pdf",
        storagePath: "/tmp/a.pdf",
        mimeType: "application/pdf",
        tamanoBytes: 10,
        subidoPorId: cuenta.id,
      },
    });
    mockAuth.mockResolvedValue(sesionDocente(docente));

    const fd = new FormData();
    fd.set("id", documento.id);
    fd.set("estado", "Aprobado");
    const r = await revisarDocumento({}, fd);

    expect(r.success).toBe(true);
    const actualizado = await prisma.documento.findUnique({ where: { id: documento.id } });
    expect(actualizado?.estado).toBe("Aprobado");
    expect(actualizado?.revisadoPorId).toBe(docente.id);

    const log = await prisma.auditLog.findFirst({ where: { entidad: "Documento", entidadId: documento.id, accion: "UPDATE" } });
    expect(log).not.toBeNull();
  });

  it("exige comentario al rechazar un documento", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const docente = await crearDocenteDeTest();
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    const documento = await prisma.documento.create({
      data: {
        emprendedorId: emprendedor.id,
        etapa: emprendedor.etapa,
        nombreArchivo: "a.pdf",
        storagePath: "/tmp/a.pdf",
        mimeType: "application/pdf",
        tamanoBytes: 10,
        subidoPorId: cuenta.id,
      },
    });
    mockAuth.mockResolvedValue(sesionDocente(docente));

    const fd = new FormData();
    fd.set("id", documento.id);
    fd.set("estado", "Rechazado");
    const r = await revisarDocumento({}, fd);

    expect(r.error).toMatch(/corregir/);
    const sinCambios = await prisma.documento.findUnique({ where: { id: documento.id } });
    expect(sinCambios?.estado).toBe("Pendiente");
  });

  it("rechaza que un emprendedor revise documentos", async () => {
    const emprendedor = await crearEmprendedorDeTest();
    const cuenta = await crearCuentaEmprendedor(emprendedor.id);
    const documento = await prisma.documento.create({
      data: {
        emprendedorId: emprendedor.id,
        etapa: emprendedor.etapa,
        nombreArchivo: "a.pdf",
        storagePath: "/tmp/a.pdf",
        mimeType: "application/pdf",
        tamanoBytes: 10,
        subidoPorId: cuenta.id,
      },
    });
    mockAuth.mockResolvedValue(sesionEmprendedor(cuenta, emprendedor.id));

    const fd = new FormData();
    fd.set("id", documento.id);
    fd.set("estado", "Aprobado");
    const r = await revisarDocumento({}, fd);

    expect(r.error).toMatch(/No autorizado/);
  });
});
