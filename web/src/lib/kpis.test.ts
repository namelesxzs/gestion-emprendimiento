import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getCumplimientoCompromisos,
  getDistribucionSector,
  getEfectividadReuniones,
  getIngresosPorMes,
} from "./kpis";
import type { Compromiso, Emprendedor, Reunion } from "./types";

function compromiso(over: Partial<Compromiso>): Compromiso {
  return {
    id: "c1",
    acompanamientoId: "a1",
    descripcion: "Entregar plan",
    fechaCompromiso: "2026-01-01",
    fechaCumplimiento: null,
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

afterEach(() => {
  vi.useRealTimers();
});

describe("getCumplimientoCompromisos", () => {
  it("cuenta cumplidos, total y vencidos por separado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00"));

    const compromisos = [
      compromiso({ id: "1", estado: "Cumplido", fechaCompromiso: "2026-01-01" }),
      compromiso({ id: "2", estado: "Pendiente", fechaCompromiso: "2026-01-01" }), // vencido
      compromiso({ id: "3", estado: "En proceso", fechaCompromiso: "2026-12-01" }), // futuro, no vencido
      compromiso({ id: "4", estado: "Cumplido", fechaCompromiso: "2026-02-01" }),
    ];

    const r = getCumplimientoCompromisos(compromisos);

    expect(r.total).toBe(4);
    expect(r.cumplidos).toBe(2);
    expect(r.vencidos).toBe(1);
    expect(r.pctCumplimiento).toBe(50);
  });

  it("da 0% con una lista vacía, sin dividir por cero", () => {
    const r = getCumplimientoCompromisos([]);
    expect(r).toEqual({ total: 0, cumplidos: 0, vencidos: 0, pctCumplimiento: 0 });
  });

  it("un compromiso Cumplido nunca cuenta como vencido aunque su fecha ya haya pasado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00"));
    const r = getCumplimientoCompromisos([compromiso({ estado: "Cumplido", fechaCompromiso: "2020-01-01" })]);
    expect(r.vencidos).toBe(0);
  });
});

describe("getEfectividadReuniones", () => {
  it("calcula el % de efectividad solo sobre reuniones resueltas (Realizada + Cancelada)", () => {
    const reuniones = [
      reunion({ id: "1", estado: "Realizada" }),
      reunion({ id: "2", estado: "Realizada" }),
      reunion({ id: "3", estado: "Cancelada" }),
      reunion({ id: "4", estado: "Programada" }),
      reunion({ id: "5", estado: "Reagendada" }),
    ];

    const r = getEfectividadReuniones(reuniones);

    expect(r.total).toBe(5);
    // 2 realizadas de 3 resueltas (2 realizadas + 1 cancelada) = 67%
    expect(r.pctEfectividad).toBe(67);
    expect(r.porEstado).toEqual([
      { estado: "Realizada", count: 2 },
      { estado: "Programada", count: 1 },
      { estado: "Reagendada", count: 1 },
      { estado: "Cancelada", count: 1 },
    ]);
  });

  it("da 0% cuando no hay ninguna reunión resuelta todavía", () => {
    const r = getEfectividadReuniones([reunion({ estado: "Programada" })]);
    expect(r.pctEfectividad).toBe(0);
  });
});

describe("getDistribucionSector", () => {
  it("agrupa por sector y ordena de mayor a menor", () => {
    const r = getDistribucionSector([
      emprendedor({ id: "1", sector: "Fintech" }),
      emprendedor({ id: "2", sector: "Agrotech" }),
      emprendedor({ id: "3", sector: "Fintech" }),
      emprendedor({ id: "4", sector: "Fintech" }),
    ]);

    expect(r).toEqual([
      { sector: "Fintech", count: 3 },
      { sector: "Agrotech", count: 1 },
    ]);
  });
});

describe("getIngresosPorMes", () => {
  it("devuelve una entrada por mes en los últimos N meses, contando por fechaIngreso", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00"));

    const r = getIngresosPorMes(
      [
        emprendedor({ id: "1", fechaIngreso: "2026-06-10" }),
        emprendedor({ id: "2", fechaIngreso: "2026-06-20" }),
        emprendedor({ id: "3", fechaIngreso: "2026-05-01" }),
        emprendedor({ id: "4", fechaIngreso: "2025-01-01" }), // fuera de la ventana de 6 meses
      ],
      6
    );

    expect(r).toHaveLength(6);
    expect(r[r.length - 1].count).toBe(2); // mes actual (junio)
    expect(r[r.length - 2].count).toBe(1); // mayo
    expect(r.reduce((sum, m) => sum + m.count, 0)).toBe(3); // el de 2025 no entra
  });
});
