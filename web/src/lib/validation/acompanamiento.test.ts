import { describe, expect, it } from "vitest";
import { acompanamientoCreateSchema } from "./acompanamiento";

const base = {
  emprendedorId: "e1",
  etapa: "Incubar",
  diagnostico: "MVP en pruebas",
  recomendaciones: "Iterar con usuarios",
  avancePct: 40,
  compromisoDescripcion: "Ejecutar 2 pruebas",
  compromisoFecha: "2026-08-01",
};

describe("acompanamientoCreateSchema", () => {
  it("acepta datos válidos", () => {
    expect(acompanamientoCreateSchema.safeParse(base).success).toBe(true);
  });

  it("coerciona avancePct desde string (viene de un <input> de formulario)", () => {
    const r = acompanamientoCreateSchema.safeParse({ ...base, avancePct: "75" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.avancePct).toBe(75);
  });

  it("rechaza avancePct fuera de 0-100", () => {
    expect(acompanamientoCreateSchema.safeParse({ ...base, avancePct: 150 }).success).toBe(false);
    expect(acompanamientoCreateSchema.safeParse({ ...base, avancePct: -1 }).success).toBe(false);
  });

  it("rechaza una etapa no reconocida", () => {
    expect(acompanamientoCreateSchema.safeParse({ ...base, etapa: "Graduarse" }).success).toBe(false);
  });
});
