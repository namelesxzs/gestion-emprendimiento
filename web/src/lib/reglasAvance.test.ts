import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { verificarReglaAvance } from "./reglasAvance";

beforeEach(limpiarDb);
afterAll(async () => {
  await prisma.$disconnect();
});

async function crearEmprendedorBase() {
  return prisma.emprendedor.create({
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
}

async function crearUsuarioBase() {
  return prisma.usuario.create({
    data: { nombre: "Docente A", correo: "docente.a@test.com", passwordHash: "x", rol: "DOCENTE" },
  });
}

describe("verificarReglaAvance", () => {
  it("permite el paso libremente cuando no hay reglas activas para la transición", async () => {
    const emprendedor = await crearEmprendedorBase();
    const destino = await prisma.fase.create({ data: { clave: "incubacion", nombre: "Incubación", orden: 2 } });

    const r = await verificarReglaAvance(emprendedor.id, null, destino.id);
    expect(r.ok).toBe(true);
  });

  it("bloquea el paso cuando falta diligenciar un instrumento requerido por una regla activa", async () => {
    const emprendedor = await crearEmprendedorBase();
    const origen = await prisma.fase.create({ data: { clave: "pre_incubacion", nombre: "Pre-incubación", orden: 1 } });
    const destino = await prisma.fase.create({ data: { clave: "incubacion", nombre: "Incubación", orden: 2 } });
    const instrumento = await prisma.instrumento.create({
      data: {
        clave: "transito_pre_incubacion_incubacion",
        nombre: "Formato de tránsito de fase",
        proposito: "Evaluar si el emprendimiento está listo para avanzar de fase.",
        camposSchema: [],
      },
    });
    await prisma.reglaAvance.create({
      data: {
        nombre: "Gate pre-incubación → incubación",
        faseOrigenId: origen.id,
        faseDestinoId: destino.id,
        instrumentosClaves: [instrumento.clave],
      },
    });

    const bloqueado = await verificarReglaAvance(emprendedor.id, origen.id, destino.id);
    expect(bloqueado.ok).toBe(false);

    const usuario = await crearUsuarioBase();
    await prisma.instrumentoRespuesta.create({
      data: {
        instrumentoId: instrumento.id,
        emprendedorId: emprendedor.id,
        datos: {},
        registradoPorId: usuario.id,
      },
    });

    const permitido = await verificarReglaAvance(emprendedor.id, origen.id, destino.id);
    expect(permitido.ok).toBe(true);
  });

  it("ignora una regla inactiva", async () => {
    const emprendedor = await crearEmprendedorBase();
    const destino = await prisma.fase.create({ data: { clave: "incubacion", nombre: "Incubación", orden: 2 } });
    const instrumento = await prisma.instrumento.create({
      data: { clave: "acta_compromiso", nombre: "Acta de compromiso", proposito: "Formalizar el ingreso.", camposSchema: [] },
    });
    await prisma.reglaAvance.create({
      data: {
        nombre: "Regla desactivada",
        faseDestinoId: destino.id,
        instrumentosClaves: [instrumento.clave],
        activa: false,
      },
    });

    const r = await verificarReglaAvance(emprendedor.id, null, destino.id);
    expect(r.ok).toBe(true);
  });
});
