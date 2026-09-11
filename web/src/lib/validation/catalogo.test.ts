import { describe, expect, it } from "vitest";
import {
  editarFaseSchema,
  editarEtapaSchema,
  editarInstrumentoSchema,
  crearReglaAvanceSchema,
  validarDatosInstrumento,
  type CampoRuntime,
} from "./catalogo";

describe("editarFaseSchema", () => {
  it("acepta datos válidos y coerciona orden a número", () => {
    const r = editarFaseSchema.safeParse({ id: "f1", nombre: "Pre-incubación", orden: "1" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.orden).toBe(1);
  });

  it("rechaza nombre vacío", () => {
    const r = editarFaseSchema.safeParse({ id: "f1", nombre: "   ", orden: 1 });
    expect(r.success).toBe(false);
  });
});

describe("editarEtapaSchema", () => {
  it("acepta faseId ausente — el eje etapa/fase es independiente", () => {
    const r = editarEtapaSchema.safeParse({ id: "e1", nombre: "Descubrir", orden: 1 });
    expect(r.success).toBe(true);
  });
});

describe("editarInstrumentoSchema", () => {
  it("exige nombre y propósito", () => {
    const r = editarInstrumentoSchema.safeParse({ id: "i1", nombre: "Ficha", proposito: "", orden: 1 });
    expect(r.success).toBe(false);
  });
});

describe("crearReglaAvanceSchema", () => {
  it("exige al menos un instrumento requerido", () => {
    const r = crearReglaAvanceSchema.safeParse({
      nombre: "Gate pre-incubación → incubación",
      faseDestinoId: "f2",
      instrumentosClaves: [],
    });
    expect(r.success).toBe(false);
  });

  it("acepta con al menos un instrumento y sin fase origen (aplica desde cualquiera)", () => {
    const r = crearReglaAvanceSchema.safeParse({
      nombre: "Gate pre-incubación → incubación",
      faseDestinoId: "f2",
      instrumentosClaves: ["rubrica_seleccion_ideas"],
    });
    expect(r.success).toBe(true);
  });
});

describe("validarDatosInstrumento", () => {
  const campos: CampoRuntime[] = [
    { clave: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    { clave: "puntaje", etiqueta: "Puntaje", tipo: "numero" },
    { clave: "autoriza", etiqueta: "Autoriza", tipo: "booleano" },
  ];

  it("rechaza cuando falta un campo requerido", () => {
    const r = validarDatosInstrumento(campos, { nombre: "", puntaje: "3" });
    expect(r.ok).toBe(false);
  });

  it("acepta y convierte tipos cuando los datos son válidos", () => {
    const r = validarDatosInstrumento(campos, { nombre: "EcoBolsas", puntaje: "4", autoriza: "on" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.datos.nombre).toBe("EcoBolsas");
      expect(r.datos.puntaje).toBe(4);
      expect(r.datos.autoriza).toBe(true);
    }
  });

  it("rechaza un campo numérico no numérico", () => {
    const r = validarDatosInstrumento(campos, { nombre: "EcoBolsas", puntaje: "no-es-numero" });
    expect(r.ok).toBe(false);
  });
});
