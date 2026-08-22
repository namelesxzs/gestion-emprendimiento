import { describe, expect, it } from "vitest";
import { docenteCreateSchema, SEDES } from "./usuario";

const base = {
  nombre: "Docente Nuevo",
  correo: "Docente.Nuevo@uie.local",
  password: "contraseña-larga",
  sede: SEDES[0],
};

describe("docenteCreateSchema", () => {
  it("acepta datos válidos", () => {
    const r = docenteCreateSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.correo).toBe("docente.nuevo@uie.local");
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    const r = docenteCreateSchema.safeParse({ ...base, password: "1234567" });
    expect(r.success).toBe(false);
  });

  it("rechaza una sede fuera de la lista SEDES", () => {
    const r = docenteCreateSchema.safeParse({ ...base, sede: "Bogotá" });
    expect(r.success).toBe(false);
  });
});
