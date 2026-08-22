import { describe, expect, it } from "vitest";
import {
  ETAPA_ORDER,
  getAcompanamientosByEmprendedor,
  getEtapaDistribution,
  getKpis,
  getProximasReuniones,
  getReunionesByEmprendedor,
  getUltimoAvance,
} from "./view";
import type { Acompanamiento, Emprendedor, Reunion } from "./types";

function emprendedor(over: Partial<Emprendedor>): Emprendedor {
  return {
    id: "e1",
    nombre: "Ana",
    emprendimiento: "EcoBolsas",
    sector: "Ambiental",
    etapa: "Descubrir",
    estado: "Activo",
    fechaIngreso: "2026-01-01",
    responsable: "Docente A",
    correo: "ana@test.com",
    telefono: "3000000000",
    ...over,
  };
}

function acompanamiento(over: Partial<Acompanamiento>): Acompanamiento {
  return {
    id: "a1",
    emprendedorId: "e1",
    fecha: "2026-01-01",
    etapa: "Descubrir",
    diagnostico: "—",
    recomendaciones: "—",
    compromisos: "—",
    avancePct: 0,
    estado: "Pendiente",
    ...over,
  };
}

function reunion(over: Partial<Reunion>): Reunion {
  return {
    id: "r1",
    emprendedorId: "e1",
    fecha: "2026-01-01",
    hora: "09:00",
    estado: "Programada",
    accion: "Crear",
    observaciones: "",
    ...over,
  };
}

describe("getEtapaDistribution", () => {
  it("incluye las 5 etapas en orden fijo, aunque alguna no tenga emprendedores", () => {
    const r = getEtapaDistribution([emprendedor({ etapa: "Formar" })]);
    expect(r.map((d) => d.etapa)).toEqual(ETAPA_ORDER);
    expect(r.find((d) => d.etapa === "Formar")?.count).toBe(1);
    expect(r.find((d) => d.etapa === "Descubrir")?.count).toBe(0);
  });
});

describe("getKpis", () => {
  it("calcula el avance promedio solo sobre los acompañamientos existentes", () => {
    const emprendedores = [emprendedor({ id: "1", estado: "Activo" }), emprendedor({ id: "2", estado: "Inactivo" })];
    const acompanamientos = [
      acompanamiento({ id: "a1", avancePct: 40 }),
      acompanamiento({ id: "a2", avancePct: 60 }),
    ];

    const r = getKpis(emprendedores, acompanamientos);

    expect(r.totalEmprendedores).toBe(2);
    expect(r.activos).toBe(1);
    expect(r.totalAcompanamientos).toBe(2);
    expect(r.avancePromedio).toBe(50);
  });

  it("no divide por cero cuando no hay acompañamientos", () => {
    const r = getKpis([], []);
    expect(r.avancePromedio).toBe(0);
  });
});

describe("getUltimoAvance / getAcompanamientosByEmprendedor", () => {
  it("toma el acompañamiento más reciente por fecha, no el último insertado", () => {
    const acompanamientos = [
      acompanamiento({ id: "viejo", fecha: "2026-01-01", avancePct: 20 }),
      acompanamiento({ id: "nuevo", fecha: "2026-06-01", avancePct: 80 }),
      acompanamiento({ id: "medio", fecha: "2026-03-01", avancePct: 50 }),
    ];

    expect(getUltimoAvance(acompanamientos, "e1")).toBe(80);
    expect(getAcompanamientosByEmprendedor(acompanamientos, "e1").map((a) => a.id)).toEqual([
      "nuevo",
      "medio",
      "viejo",
    ]);
  });

  it("devuelve undefined si el emprendedor no tiene acompañamientos", () => {
    expect(getUltimoAvance([], "e1")).toBeUndefined();
  });
});

describe("getReunionesByEmprendedor", () => {
  it("filtra por emprendedor y ordena de más reciente a más antigua", () => {
    const reuniones = [
      reunion({ id: "1", emprendedorId: "e1", fecha: "2026-01-01" }),
      reunion({ id: "2", emprendedorId: "e2", fecha: "2026-06-01" }),
      reunion({ id: "3", emprendedorId: "e1", fecha: "2026-03-01" }),
    ];

    expect(getReunionesByEmprendedor(reuniones, "e1").map((r) => r.id)).toEqual(["3", "1"]);
  });
});

describe("getProximasReuniones", () => {
  it("solo incluye Programada/Reagendada, ordenadas de más próxima a más lejana", () => {
    const emprendedores = [emprendedor({ id: "e1", nombre: "Ana" }), emprendedor({ id: "e2", nombre: "Luis" })];
    const reuniones = [
      reunion({ id: "1", emprendedorId: "e1", estado: "Realizada", fecha: "2026-01-01" }),
      reunion({ id: "2", emprendedorId: "e2", estado: "Reagendada", fecha: "2026-08-01" }),
      reunion({ id: "3", emprendedorId: "e1", estado: "Programada", fecha: "2026-07-01" }),
      reunion({ id: "4", emprendedorId: "e1", estado: "Cancelada", fecha: "2026-06-01" }),
    ];

    const r = getProximasReuniones(reuniones, emprendedores);

    expect(r.map((x) => x.id)).toEqual(["3", "2"]);
    expect(r[0].emprendedorNombre).toBe("Ana");
    expect(r[1].emprendedorNombre).toBe("Luis");
  });

  it("usa '—' si no encuentra el emprendedor de la reunión", () => {
    const r = getProximasReuniones([reunion({ emprendedorId: "no-existe", estado: "Programada" })], []);
    expect(r[0].emprendedorNombre).toBe("—");
  });
});
