import { describe, expect, it } from "vitest";
import { cohorteSchema, emprendedorCreateSchema, emprendedorUpdateSchema, integranteEquipoSchema } from "./emprendedor";

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

  it("la ficha de caracterización (Manual 6.2) es opcional", () => {
    const r = emprendedorCreateSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("acepta la ficha de caracterización completa cuando viene con datos válidos", () => {
    const r = emprendedorCreateSchema.safeParse({
      ...base,
      sede: "Medellín",
      tipoInnovacion: "Base tecnológica",
      madurez: "Prototipo",
      canalPostulacion: "Feria",
      problema: "Falta de reciclaje en el campus",
      descripcionIdea: "Bolsas reutilizables a partir de residuos textiles",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza un tipo de innovación fuera del catálogo del Manual", () => {
    const r = emprendedorCreateSchema.safeParse({ ...base, tipoInnovacion: "Otro" });
    expect(r.success).toBe(false);
  });
});

describe("cohorteSchema", () => {
  it("acepta solo el nombre (sede y fechas opcionales)", () => {
    const r = cohorteSchema.safeParse({ nombre: "Cohorte 2026-2" });
    expect(r.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const r = cohorteSchema.safeParse({ nombre: "" });
    expect(r.success).toBe(false);
  });
});

describe("integranteEquipoSchema", () => {
  it("exige emprendedorId y nombre", () => {
    const r = integranteEquipoSchema.safeParse({ emprendedorId: "e1", nombre: "Juan Gómez" });
    expect(r.success).toBe(true);
  });

  it("rechaza sin emprendedorId", () => {
    const r = integranteEquipoSchema.safeParse({ nombre: "Juan Gómez" });
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
