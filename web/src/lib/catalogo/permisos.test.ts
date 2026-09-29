import { describe, expect, it } from "vitest";
import { puedeDiligenciarInstrumento } from "./permisos";

describe("puedeDiligenciarInstrumento", () => {
  it("el Administrador siempre puede, sin importar el responsable del Manual", () => {
    expect(puedeDiligenciarInstrumento("ADMINISTRADOR", "Asesor / comité evaluador")).toBe(true);
    expect(puedeDiligenciarInstrumento("ADMINISTRADOR", null)).toBe(true);
  });

  it("el Docente (asesor) siempre puede, es a quien nombra el Manual en casi todos los formatos", () => {
    expect(puedeDiligenciarInstrumento("DOCENTE", "Emprendedor")).toBe(true);
    expect(puedeDiligenciarInstrumento("DOCENTE", "Jurado / asesor evaluador")).toBe(true);
    expect(puedeDiligenciarInstrumento("DOCENTE", null)).toBe(true);
  });

  it("el Coordinador nunca diligencia — solo consulta indicadores (RF13)", () => {
    expect(puedeDiligenciarInstrumento("COORDINADOR", "Emprendedor")).toBe(false);
  });

  it("el Emprendedor solo diligencia los instrumentos donde el Manual lo nombra", () => {
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", "Emprendedor")).toBe(true);
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", "Emprendedor, con el asesor")).toBe(true);
  });

  it("el Emprendedor no diligencia los instrumentos exclusivos del asesor", () => {
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", "Asesor")).toBe(false);
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", "Asesor / comité evaluador")).toBe(false);
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", "Jurado / asesor evaluador")).toBe(false);
    expect(puedeDiligenciarInstrumento("EMPRENDEDOR", null)).toBe(false);
  });
});
