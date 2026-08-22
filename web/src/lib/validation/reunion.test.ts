import { describe, expect, it } from "vitest";
import { reunionCancelarSchema, reunionCreateSchema, reunionReagendarSchema } from "./reunion";

describe("reunionCreateSchema", () => {
  it("acepta datos válidos", () => {
    const r = reunionCreateSchema.safeParse({
      emprendedorId: "e1",
      fecha: "2026-08-01",
      hora: "09:00",
      observaciones: "Primera mentoría",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza observaciones vacías", () => {
    const r = reunionCreateSchema.safeParse({
      emprendedorId: "e1",
      fecha: "2026-08-01",
      hora: "09:00",
      observaciones: "   ",
    });
    expect(r.success).toBe(false);
  });
});

describe("reunionReagendarSchema", () => {
  it("exige id, fecha y hora", () => {
    expect(reunionReagendarSchema.safeParse({ id: "r1", fecha: "2026-08-01", hora: "10:00" }).success).toBe(true);
    expect(reunionReagendarSchema.safeParse({ id: "r1", fecha: "", hora: "10:00" }).success).toBe(false);
  });
});

describe("reunionCancelarSchema", () => {
  it("exige solo id", () => {
    expect(reunionCancelarSchema.safeParse({ id: "r1" }).success).toBe(true);
    expect(reunionCancelarSchema.safeParse({ id: "" }).success).toBe(false);
  });
});
