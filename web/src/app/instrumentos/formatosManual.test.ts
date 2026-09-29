import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";

// Fidelidad al Manual de Formatos y Metodologías FUMC: registros múltiples
// (§5.1/§5.3), tablas con puntaje 1-5 y total (anexos 6.3/7.4), firmas
// (6.11-6.13, 7.5) y revisión por responsable con plazo (§5.6).

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { guardarRespuestaInstrumento, revisarRespuestaInstrumento } = await import("./actions");

async function crearEmprendedor() {
  return prisma.emprendedor.create({
    data: {
      nombre: "Emprendedor Test",
      emprendimiento: "Negocio",
      sector: "Sector",
      etapa: "Descubrir",
      estado: "Activo",
      fechaIngreso: new Date("2026-01-01"),
      correo: `emp-${Math.random()}@test.com`,
      telefono: "3000000000",
    },
  });
}

async function crearInstrumento(extra: Record<string, unknown> = {}) {
  return prisma.instrumento.create({
    data: {
      clave: `inst-${Math.random()}`,
      nombre: "Instrumento de prueba",
      proposito: "Probar el motor de formularios genérico.",
      responsableDiligencia: "Asesor",
      camposSchema: [{ clave: "nota", etiqueta: "Nota", tipo: "texto" }],
      ...extra,
    },
  });
}

async function crearDocente() {
  const docente = await prisma.usuario.create({
    data: { nombre: "Docente Asesor", correo: `docente-${Math.random()}@test.com`, passwordHash: "x", rol: "DOCENTE" },
  });
  return { docente, sesion: { user: { id: docente.id, rol: "DOCENTE" as const, emprendedorId: null, name: docente.nombre } } };
}

async function crearCuentaPortal(emprendedorId: string) {
  const cuenta = await prisma.usuario.create({
    data: { nombre: "Portal Test", correo: `portal-${Math.random()}@test.com`, passwordHash: "x", rol: "EMPRENDEDOR", emprendedorId },
  });
  return { user: { id: cuenta.id, rol: "EMPRENDEDOR" as const, emprendedorId, name: cuenta.nombre } };
}

function fd(instrumentoId: string, emprendedorId: string, valores: Record<string, string> = { nota: "Respuesta" }) {
  const f = new FormData();
  f.set("instrumentoId", instrumentoId);
  f.set("emprendedorId", emprendedorId);
  for (const [k, v] of Object.entries(valores)) f.set(k, v);
  return f;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("registros únicos y múltiples", () => {
  it("un instrumento de registro único se edita, no se duplica", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento();
    mockAuth.mockResolvedValue((await crearDocente()).sesion);

    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));
    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(await prisma.instrumentoRespuesta.count({ where: { instrumentoId: instrumento.id } })).toBe(1);
  });

  it("un instrumento que admite varios (bitácora de cada sesión) crea un registro nuevo cada vez", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento({ permiteMultiples: true });
    mockAuth.mockResolvedValue((await crearDocente()).sesion);

    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));
    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));

    expect(await prisma.instrumentoRespuesta.count({ where: { instrumentoId: instrumento.id } })).toBe(2);
  });

  it("no permite editar un registro de otro emprendedor pasando su respuestaId", async () => {
    const a = await crearEmprendedor();
    const b = await crearEmprendedor();
    const instrumento = await crearInstrumento();
    mockAuth.mockResolvedValue((await crearDocente()).sesion);
    await guardarRespuestaInstrumento({}, fd(instrumento.id, a.id));
    const deA = await prisma.instrumentoRespuesta.findFirstOrThrow({ where: { emprendedorId: a.id } });

    const r = await guardarRespuestaInstrumento({}, fd(instrumento.id, b.id, { nota: "x", respuestaId: deA.id }));

    expect(r.error).toMatch(/no pertenece/);
  });
});

describe("tablas, puntajes y firmas", () => {
  const camposRubrica = [
    {
      clave: "criterios",
      etiqueta: "Criterios",
      tipo: "tabla",
      requerido: true,
      filas: [
        { clave: "innovacion", etiqueta: "Innovación" },
        { clave: "equipo", etiqueta: "Equipo" },
      ],
      columnas: [
        { clave: "puntaje", etiqueta: "Puntaje (1-5)", tipo: "numero", min: 1, max: 5, requerido: true },
        { clave: "observaciones", etiqueta: "Observaciones", tipo: "textarea" },
      ],
    },
    { clave: "total", etiqueta: "Total", tipo: "total", sumaDe: { tabla: "criterios", columna: "puntaje" } },
    { clave: "firmaAsesor", etiqueta: "Firma del asesor", tipo: "firma", firmante: "asesor", requerido: true },
  ];

  it("guarda la tabla por criterio, calcula el total en el servidor y sella la firma", async () => {
    const emprendedor = await crearEmprendedor();
    const rubrica = await crearInstrumento({ camposSchema: camposRubrica });
    const { docente, sesion } = await crearDocente();
    mockAuth.mockResolvedValue(sesion);

    const r = await guardarRespuestaInstrumento(
      {},
      fd(rubrica.id, emprendedor.id, {
        criterios__innovacion__puntaje: "4",
        criterios__innovacion__observaciones: "Buena novedad",
        criterios__equipo__puntaje: "5",
        firmaAsesor: "Docente Asesor",
        firmaAsesor__confirmo: "on",
      })
    );

    expect(r.success).toBe(true);
    const guardada = await prisma.instrumentoRespuesta.findFirstOrThrow({ where: { instrumentoId: rubrica.id } });
    const datos = guardada.datos as Record<string, unknown>;
    expect(datos.total).toBe(9);
    expect(datos.criterios).toEqual([
      { fila: "innovacion", puntaje: 4, observaciones: "Buena novedad" },
      { fila: "equipo", puntaje: 5, observaciones: "" },
    ]);
    expect((datos.firmaAsesor as { firmadoPorId: string }).firmadoPorId).toBe(docente.id);
  });

  it("rechaza un puntaje fuera de la escala 1-5 del Manual", async () => {
    const emprendedor = await crearEmprendedor();
    const rubrica = await crearInstrumento({ camposSchema: camposRubrica });
    mockAuth.mockResolvedValue((await crearDocente()).sesion);

    const r = await guardarRespuestaInstrumento(
      {},
      fd(rubrica.id, emprendedor.id, {
        criterios__innovacion__puntaje: "7",
        criterios__equipo__puntaje: "3",
        firmaAsesor: "Docente Asesor",
        firmaAsesor__confirmo: "on",
      })
    );

    expect(r.error).toMatch(/menor o igual a 5/);
  });

  it("no firma sin la casilla de confirmación", async () => {
    const emprendedor = await crearEmprendedor();
    const rubrica = await crearInstrumento({ camposSchema: camposRubrica });
    mockAuth.mockResolvedValue((await crearDocente()).sesion);

    const r = await guardarRespuestaInstrumento(
      {},
      fd(rubrica.id, emprendedor.id, {
        criterios__innovacion__puntaje: "3",
        criterios__equipo__puntaje: "3",
        firmaAsesor: "Docente Asesor",
      })
    );

    expect(r.error).toMatch(/confirmación de firma/);
  });

  it("el Emprendedor no puede poner la firma del asesor aunque la envíe", async () => {
    const emprendedor = await crearEmprendedor();
    const acta = await crearInstrumento({
      responsableDiligencia: "Emprendedor",
      camposSchema: [
        { clave: "firmaEmprendedor", etiqueta: "Firma del emprendedor", tipo: "firma", firmante: "emprendedor", requerido: true },
        { clave: "firmaAsesor", etiqueta: "Firma del asesor", tipo: "firma", firmante: "asesor", requerido: true },
      ],
    });
    mockAuth.mockResolvedValue(await crearCuentaPortal(emprendedor.id));

    const r = await guardarRespuestaInstrumento(
      {},
      fd(acta.id, emprendedor.id, {
        firmaEmprendedor: "Emprendedor Test",
        firmaEmprendedor__confirmo: "on",
        firmaAsesor: "Firma falsa del asesor",
        firmaAsesor__confirmo: "on",
      })
    );

    expect(r.success).toBe(true);
    const datos = (await prisma.instrumentoRespuesta.findFirstOrThrow({ where: { instrumentoId: acta.id } }))
      .datos as Record<string, unknown>;
    expect((datos.firmaEmprendedor as { nombre: string }).nombre).toBe("Emprendedor Test");
    expect(datos.firmaAsesor).toBeUndefined();
  });
});

describe("revisión por el responsable (Manual §5.6)", () => {
  it("el Coordinador revisa los formatos que el Manual le asigna; el Emprendedor nunca", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento({ responsableRevisa: "Coordinador" });
    mockAuth.mockResolvedValue((await crearDocente()).sesion);
    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));
    const respuesta = await prisma.instrumentoRespuesta.findFirstOrThrow({ where: { instrumentoId: instrumento.id } });

    const rev = new FormData();
    rev.set("respuestaId", respuesta.id);
    rev.set("decision", "Revisado");

    mockAuth.mockResolvedValue(await crearCuentaPortal(emprendedor.id));
    expect((await revisarRespuestaInstrumento({}, rev)).error).toBeTruthy();

    const coord = await prisma.usuario.create({
      data: { nombre: "Coord", correo: `coord-${Math.random()}@test.com`, passwordHash: "x", rol: "COORDINADOR" },
    });
    mockAuth.mockResolvedValue({ user: { id: coord.id, rol: "COORDINADOR" as const, emprendedorId: null, name: "Coord" } });
    expect((await revisarRespuestaInstrumento({}, rev)).success).toBe(true);

    const revisada = await prisma.instrumentoRespuesta.findUniqueOrThrow({ where: { id: respuesta.id } });
    expect(revisada.estadoRevision).toBe("Revisado");
    expect(revisada.revisadoPorId).toBe(coord.id);
  });

  it("devolver exige comentario, y editar después lo regresa a Pendiente", async () => {
    const emprendedor = await crearEmprendedor();
    const instrumento = await crearInstrumento({ responsableRevisa: "Asesor" });
    mockAuth.mockResolvedValue((await crearDocente()).sesion);
    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));
    const respuesta = await prisma.instrumentoRespuesta.findFirstOrThrow({ where: { instrumentoId: instrumento.id } });

    const rev = new FormData();
    rev.set("respuestaId", respuesta.id);
    rev.set("decision", "Devuelto");
    expect((await revisarRespuestaInstrumento({}, rev)).error).toMatch(/corregirse/);
    rev.set("comentario", "Falta evidencia");
    expect((await revisarRespuestaInstrumento({}, rev)).success).toBe(true);

    await guardarRespuestaInstrumento({}, fd(instrumento.id, emprendedor.id));
    const editada = await prisma.instrumentoRespuesta.findUniqueOrThrow({ where: { id: respuesta.id } });
    expect(editada.estadoRevision).toBe("Pendiente");
  });
});
