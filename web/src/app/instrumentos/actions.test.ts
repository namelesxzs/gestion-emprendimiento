import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { guardarRespuestaInstrumento } = await import("./actions");

async function crearEmprendedor(correo = `emp-${Math.random()}@test.com`) {
  return prisma.emprendedor.create({
    data: {
      nombre: "Emprendedor Test",
      emprendimiento: "Negocio",
      sector: "Sector",
      etapa: "Descubrir",
      estado: "Activo",
      fechaIngreso: new Date("2026-01-01"),
      correo,
      telefono: "3000000000",
    },
  });
}

/** Instrumento con campos mínimos y un `responsableDiligencia` a elegir —
 * refleja cómo el Manual lo describe en prosa, no con un enum cerrado. */
async function crearInstrumento(responsableDiligencia: string) {
  return prisma.instrumento.create({
    data: {
      clave: `inst-${Math.random()}`,
      nombre: "Instrumento de prueba",
      proposito: "Probar el motor de formularios genérico.",
      responsableDiligencia,
      camposSchema: [{ clave: "nota", etiqueta: "Nota", tipo: "texto" }],
    },
  });
}

/** El registradoPorId de InstrumentoRespuesta es FK a Usuario — la cuenta de
 * portal debe existir de verdad, no un id de mentira. */
async function crearCuentaPortal(emprendedorId: string) {
  const cuenta = await prisma.usuario.create({
    data: {
      nombre: "Portal Test",
      correo: `portal-${Math.random()}@test.com`,
      passwordHash: "x",
      rol: "EMPRENDEDOR",
      emprendedorId,
    },
  });
  return { user: { id: cuenta.id, rol: "EMPRENDEDOR" as const, emprendedorId, name: cuenta.nombre } };
}

function fd(instrumentoId: string, emprendedorId: string) {
  const f = new FormData();
  f.set("instrumentoId", instrumentoId);
  f.set("emprendedorId", emprendedorId);
  f.set("nota", "Respuesta de prueba");
  return f;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("guardarRespuestaInstrumento — responsable de diligenciar del Manual", () => {
  it("el Emprendedor puede diligenciar un instrumento que el Manual le asigna a él, en su propio registro", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento("Emprendedor");
    mockAuth.mockResolvedValue(await crearCuentaPortal(emprendedor.id));

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(r.success).toBe(true);
    const respuesta = await prisma.instrumentoRespuesta.findFirst({
      where: { instrumentoId: instrumento.id, emprendedorId: emprendedor.id },
    });
    expect(respuesta).not.toBeNull();
  });

  it("el Emprendedor NO puede diligenciar un instrumento que el Manual reserva al asesor, ni en su propio registro", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento("Asesor / comité evaluador");
    mockAuth.mockResolvedValue(await crearCuentaPortal(emprendedor.id));

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(r.error).toMatch(/diligencia/);
    const respuesta = await prisma.instrumentoRespuesta.findFirst({
      where: { instrumentoId: instrumento.id, emprendedorId: emprendedor.id },
    });
    expect(respuesta).toBeNull();
  });

  it("el Emprendedor no puede diligenciar instrumentos del registro de otro emprendedor (RF13)", async () => {
    const propio = await crearEmprendedor();
    const otro = await crearEmprendedor();
    const instrumento = await crearInstrumento("Emprendedor");
    mockAuth.mockResolvedValue(await crearCuentaPortal(propio.id));

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, otro.id));

    expect(r.error).toBeTruthy();
    const respuesta = await prisma.instrumentoRespuesta.findFirst({
      where: { instrumentoId: instrumento.id, emprendedorId: otro.id },
    });
    expect(respuesta).toBeNull();
  });

  it("el Coordinador nunca diligencia, sin importar el instrumento", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento("Emprendedor");
    mockAuth.mockResolvedValue({ user: { id: "c1", rol: "COORDINADOR" as const, emprendedorId: null, name: "Coord" } });

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(r.error).toMatch(/Coordinador/);
  });

  it("el Docente puede diligenciar cualquier instrumento, incluso los reservados al asesor", async () => {
    const emprendedor = await crearEmprendedor();
    const docente = await prisma.usuario.create({
      data: { nombre: "Docente", correo: `docente-${Math.random()}@test.com`, passwordHash: "x", rol: "DOCENTE" },
    });
    const instrumento = await crearInstrumento("Asesor / comité evaluador");
    mockAuth.mockResolvedValue({ user: { id: docente.id, rol: "DOCENTE" as const, emprendedorId: null, name: docente.nombre } });

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(r.success).toBe(true);
  });
});
