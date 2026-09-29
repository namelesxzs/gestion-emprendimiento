import { describe, expect, it } from "vitest";
import { INSTRUMENTOS_SEED } from "../../../prisma/catalogoSeed";

// Contrato con el Manual de Formatos y Metodologías FUMC (agosto 2026): si
// alguien cambia el catálogo sembrado y deja de calcar el documento, estos
// tests fallan. Cada expectativa cita la sección del Manual.

const porClave = (clave: string) => {
  const i = INSTRUMENTOS_SEED.find((x) => x.clave === clave);
  if (!i) throw new Error(`Falta el instrumento ${clave}`);
  return i;
};
const campo = (clave: string, c: string) => porClave(clave).campos.find((x) => x.clave === c);

describe("catálogo sembrado vs Manual FUMC", () => {
  it("tiene los 13 formatos de Fase 1 (§3), los 17 de Fase 2 (§4) y el gate de salida (anexo 7.5)", () => {
    expect(INSTRUMENTOS_SEED.filter((i) => i.faseClave === "pre_incubacion")).toHaveLength(13);
    expect(INSTRUMENTOS_SEED.filter((i) => i.faseClave === "incubacion")).toHaveLength(18);
    expect(new Set(INSTRUMENTOS_SEED.map((i) => i.clave)).size).toBe(31);
    porClave("transito_salida_incubacion");
  });

  it("6.1 — integrantes del equipo como tabla con las 6 columnas del Manual y firma del postulante", () => {
    const t = campo("ficha_inscripcion", "integrantesEquipo")!;
    expect(t.tipo).toBe("tabla");
    expect(t.columnas!.map((c) => c.etiqueta)).toEqual([
      "Nombre completo",
      "Documento",
      "Programa académico",
      "Semestre",
      "Correo institucional",
      "Teléfono",
    ]);
    expect(campo("ficha_inscripcion", "firmaPostulante")!.tipo).toBe("firma");
  });

  it("6.3 — rúbrica: 5 criterios con puntaje 1-5 y observaciones por criterio, total máx. 25", () => {
    const t = campo("rubrica_seleccion_ideas", "criterios")!;
    expect(t.filas!.map((f) => f.etiqueta)).toEqual([
      "Innovación",
      "Viabilidad técnica",
      "Viabilidad comercial",
      "Equipo emprendedor",
      "Impacto social, ambiental o económico",
    ]);
    const puntaje = t.columnas!.find((c) => c.clave === "puntaje")!;
    expect([puntaje.min, puntaje.max]).toEqual([1, 5]);
    expect(t.columnas!.some((c) => c.clave === "observaciones")).toBe(true);
    expect(campo("rubrica_seleccion_ideas", "puntajeTotal")!.max).toBe(25);
    expect(campo("rubrica_seleccion_ideas", "decision")!.opciones).toEqual([
      "Admite a pre-incubación",
      "Admite con ajustes",
      "No admite",
    ]);
  });

  it("6.10 — bitácora: una por sesión y transversal a ambas fases (§5.3)", () => {
    const b = porClave("bitacora_mentoria");
    expect(b.permiteMultiples).toBe(true);
    expect(b.transversal).toBe(true);
  });

  it("6.6/§5.1 — el BMC se versiona en cada gate (varios registros)", () => {
    expect(porClave("bmc_inicial").permiteMultiples).toBe(true);
    expect(porClave("bmc_validado").permiteMultiples).toBe(true);
  });

  it("6.11, 6.12 — firmas del emprendedor y del asesor", () => {
    for (const clave of ["acta_compromiso", "consentimiento_datos"]) {
      const firmas = porClave(clave).campos.filter((c) => c.tipo === "firma");
      expect(firmas.map((f) => f.firmante).sort()).toEqual(["asesor", "emprendedor"]);
    }
    expect(campo("consentimiento_datos", "autorizaTratamientoDatos")!.opciones).toEqual(["Sí", "No"]);
  });

  it("6.13 y 7.5 — gates: 3 criterios Sí/No, decisión que habilita el avance y firma del asesor", () => {
    const casos: [string, string][] = [
      ["transito_pre_incubacion_incubacion", "Avanza a incubación"],
      ["transito_salida_incubacion", "Gradúa"],
    ];
    for (const [clave, habilita] of casos) {
      const i = porClave(clave);
      expect(i.campos.filter((c) => c.etiqueta.startsWith("Criterio")).map((c) => c.opciones)).toEqual([
        ["Sí", "No"],
        ["Sí", "No"],
        ["Sí", "No"],
      ]);
      expect(campo(clave, "decision")!.valorHabilitaAvance).toBe(habilita);
      expect(campo(clave, "firmaAsesor")).toMatchObject({ tipo: "firma", firmante: "asesor", requerido: true });
    }
  });

  it("7.2 — matriz de riesgos como tabla con tipo/probabilidad/impacto del Manual", () => {
    const t = campo("matriz_riesgos", "riesgos")!;
    expect(t.columnas!.find((c) => c.clave === "tipo")!.opciones).toEqual(["Mercado", "Financiero", "Legal", "Técnico"]);
    expect(t.columnas!.find((c) => c.clave === "probabilidad")!.opciones).toEqual(["Alta", "Media", "Baja"]);
    expect(t.columnas!.find((c) => c.clave === "impacto")!.opciones).toEqual(["Alto", "Medio", "Bajo"]);
  });

  it("7.3 — KPIs: 4 indicadores × meta, periodo 1, periodo 2 y observaciones", () => {
    const t = campo("kpis_impacto", "indicadores")!;
    expect(t.filas!.map((f) => f.etiqueta)).toEqual([
      "Ventas / ingresos",
      "Usuarios o clientes activos",
      "Empleos generados",
      "Avance del MVP (%)",
    ]);
    expect(t.columnas!.map((c) => c.etiqueta)).toEqual(["Meta", "Resultado periodo 1", "Resultado periodo 2", "Observaciones"]);
  });

  it("7.4 — rúbrica de pitch: 5 criterios × puntaje 1-5, observaciones y recomendación", () => {
    const t = campo("rubrica_pitch", "criterios")!;
    expect(t.filas).toHaveLength(5);
    expect(t.columnas!.map((c) => c.clave)).toEqual(["puntaje", "observaciones", "recomendacion"]);
    expect(porClave("rubrica_pitch").permiteMultiples).toBe(true);
  });

  it("7.6 — encuesta de satisfacción al cierre de cada fase (transversal)", () => {
    expect(porClave("encuesta_satisfaccion").transversal).toBe(true);
    const cal = campo("encuesta_satisfaccion", "calificacionGeneral")!;
    expect([cal.min, cal.max]).toEqual([1, 5]);
  });
});
