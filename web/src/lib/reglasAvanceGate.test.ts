import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { verificarReglaAvance } from "./reglasAvance";
import { INSTRUMENTOS_SEED, REGLAS_AVANCE_SEED } from "../../prisma/catalogoSeed";

// Manual §5.2: "ningún emprendimiento pase de pre-incubación a incubación sin
// este formato diligenciado y firmado por el asesor".

beforeEach(limpiarDb);
afterAll(async () => {
  await prisma.$disconnect();
});

const firma = { nombre: "Docente A", firmadoPorId: "u", firmadoPorNombre: "Docente A", firmadoPorRol: "DOCENTE", fecha: "2026-09-01T00:00:00Z" };

async function escenario() {
  const gate = INSTRUMENTOS_SEED.find((i) => i.clave === "transito_pre_incubacion_incubacion")!;
  const emprendedor = await prisma.emprendedor.create({
    data: {
      nombre: "Ana Gómez",
      emprendimiento: "EcoBolsas",
      sector: "Ambiental",
      etapa: "Descubrir",
      estado: "Activo",
      fechaIngreso: new Date("2026-01-10T00:00:00"),
      correo: "ana@test.com",
      telefono: "3001111111",
    },
  });
  const usuario = await prisma.usuario.create({
    data: { nombre: "Docente A", correo: "docente.a@test.com", passwordHash: "x", rol: "DOCENTE" },
  });
  const origen = await prisma.fase.create({ data: { clave: "pre_incubacion", nombre: "Pre-incubación", orden: 1 } });
  const destino = await prisma.fase.create({ data: { clave: "incubacion", nombre: "Incubación", orden: 2 } });
  const instrumento = await prisma.instrumento.create({
    data: {
      clave: gate.clave,
      nombre: gate.nombre,
      proposito: gate.proposito,
      camposSchema: JSON.parse(JSON.stringify(gate.campos)),
      permiteMultiples: true,
    },
  });
  await prisma.reglaAvance.create({
    data: { nombre: "Gate", faseOrigenId: origen.id, faseDestinoId: destino.id, instrumentosClaves: [instrumento.clave] },
  });
  const responder = (datos: object, updatedAt: Date) =>
    prisma.instrumentoRespuesta.create({
      data: { instrumentoId: instrumento.id, emprendedorId: emprendedor.id, datos, registradoPorId: usuario.id, updatedAt },
    });
  return { emprendedor, origen, destino, responder };
}

describe("gate sembrado del Manual", () => {
  it("siembra por defecto los dos gates del Manual (6.13 y 7.5)", () => {
    expect(REGLAS_AVANCE_SEED.map((r) => r.instrumentosClaves[0])).toEqual([
      "transito_pre_incubacion_incubacion",
      "transito_salida_incubacion",
    ]);
    for (const r of REGLAS_AVANCE_SEED) {
      expect(INSTRUMENTOS_SEED.some((i) => i.clave === r.instrumentosClaves[0])).toBe(true);
    }
  });

  it("bloquea si la decisión es 'Se mantiene en pre-incubación'", async () => {
    const { emprendedor, origen, destino, responder } = await escenario();
    await responder({ decision: "Se mantiene en pre-incubación", firmaAsesor: firma }, new Date("2026-09-01"));
    const r = await verificarReglaAvance(emprendedor.id, origen.id, destino.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Avanza a incubación/);
  });

  it("bloquea si la decisión es 'Avanza' pero falta la firma del asesor", async () => {
    const { emprendedor, origen, destino, responder } = await escenario();
    await responder({ decision: "Avanza a incubación" }, new Date("2026-09-01"));
    const r = await verificarReglaAvance(emprendedor.id, origen.id, destino.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/firma/);
  });

  it("usa la evaluación más reciente: una re-evaluación favorable y firmada habilita el avance", async () => {
    const { emprendedor, origen, destino, responder } = await escenario();
    await responder({ decision: "Se mantiene en pre-incubación", firmaAsesor: firma }, new Date("2026-08-01"));
    await responder({ decision: "Avanza a incubación", firmaAsesor: firma }, new Date("2026-09-01"));
    const r = await verificarReglaAvance(emprendedor.id, origen.id, destino.id);
    expect(r.ok).toBe(true);
  });
});
