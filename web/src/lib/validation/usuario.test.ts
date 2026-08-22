import { describe, expect, it } from "vitest";
import { usuarioCreateSchema, usuarioUpdateSchema, SEDES } from "./usuario";

const baseDocente = {
  nombre: "Docente Nuevo",
  correo: "Docente.Nuevo@uie.local",
  password: "contraseña-larga",
  rol: "DOCENTE",
  sede: SEDES[0],
};

const baseSinSede = {
  nombre: "Persona Nueva",
  correo: "persona.nueva@uie.local",
  password: "contraseña-larga",
};

describe("usuarioCreateSchema — rol DOCENTE", () => {
  it("acepta datos válidos y normaliza el correo a minúsculas", () => {
    const r = usuarioCreateSchema.safeParse(baseDocente);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.correo).toBe("docente.nuevo@uie.local");
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(usuarioCreateSchema.safeParse({ ...baseDocente, password: "1234567" }).success).toBe(false);
  });

  it("exige sede — rechaza sin sede", () => {
    expect(usuarioCreateSchema.safeParse({ ...baseSinSede, rol: "DOCENTE" }).success).toBe(false);
  });

  it("rechaza una sede fuera de la lista SEDES", () => {
    expect(usuarioCreateSchema.safeParse({ ...baseDocente, sede: "Bogotá" }).success).toBe(false);
  });
});

describe("usuarioCreateSchema — roles sin sede", () => {
  it("acepta ADMINISTRADOR y COORDINADOR sin sede", () => {
    expect(usuarioCreateSchema.safeParse({ ...baseSinSede, rol: "ADMINISTRADOR" }).success).toBe(true);
    expect(usuarioCreateSchema.safeParse({ ...baseSinSede, rol: "COORDINADOR" }).success).toBe(true);
  });

  it("rechaza un rol fuera de ROLES_GESTIONABLES (p.ej. EMPRENDEDOR)", () => {
    expect(usuarioCreateSchema.safeParse({ ...baseSinSede, rol: "EMPRENDEDOR" }).success).toBe(false);
  });
});

describe("usuarioUpdateSchema", () => {
  it("exige id además de los campos de creación (sin password)", () => {
    const sinPassword = { nombre: baseDocente.nombre, correo: baseDocente.correo, rol: baseDocente.rol, sede: baseDocente.sede };
    expect(usuarioUpdateSchema.safeParse(sinPassword).success).toBe(false);
    expect(usuarioUpdateSchema.safeParse({ ...sinPassword, id: "u1" }).success).toBe(true);
  });
});
