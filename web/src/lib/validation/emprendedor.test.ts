import { describe, expect, it } from "vitest";
import { emprendedorCreateSchema, emprendedorUpdateSchema } from "./emprendedor";

const base = {
  nombre: "Ana Gómez",
  emprendimiento: "EcoBolsas",
  sector: "Ambiental",
  etapa: "Descubrir",
  estado: "Activo",
  fechaIngreso: "2026-01-15",
  correo: "ANA@Test.com",
  telefono: "3001234567",
};

describe("emprendedorCreateSchema", () => {
  it("acepta datos válidos y normaliza el correo a minúsculas", () => {
    const r = emprendedorCreateSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.correo).toBe("ana@test.com");
  });

  it("rechaza una etapa no reconocida", () => {
    const r = emprendedorCreateSchema.safeParse({ ...base, etapa: "NoExiste" });
    expect(r.success).toBe(false);
  });

  it("rechaza un correo inválido", () => {
    const r = emprendedorCreateSchema.safeParse({ ...base, correo: "no-es-correo" });
    expect(r.success).toBe(false);
  });

  it("rechaza nombre vacío o solo espacios", () => {
    const r = emprendedorCreateSchema.safeParse({ ...base, nombre: "   " });
    expect(r.success).toBe(false);
  });
});

describe("emprendedorUpdateSchema", () => {
  it("exige id además de los campos de creación", () => {
    const r = emprendedorUpdateSchema.safeParse(base);
    expect(r.success).toBe(false);
  });

  it("acepta con id presente", () => {
    const r = emprendedorUpdateSchema.safeParse({ ...base, id: "abc123" });
    expect(r.success).toBe(true);
  });
});
