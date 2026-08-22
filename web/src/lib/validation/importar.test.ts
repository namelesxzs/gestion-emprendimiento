import { describe, expect, it } from "vitest";
import { filaEmprendedorSchema } from "./importar";

const base = {
  nombre: "Juan Pérez",
  emprendimiento: "Mi Emprendimiento",
  sector: "Tecnología",
  etapa: "Descubrir",
  estado: "Activo",
  fechaIngreso: "2026-01-15",
  correo: "juan@test.com",
  telefono: "3001234567",
};

describe("filaEmprendedorSchema", () => {
  it("acepta una fila válida, con responsable opcional", () => {
    expect(filaEmprendedorSchema.safeParse(base).success).toBe(true);
    expect(filaEmprendedorSchema.safeParse({ ...base, responsable: "Docente A" }).success).toBe(true);
  });

  it("rechaza una fecha que no sea AAAA-MM-DD", () => {
    expect(filaEmprendedorSchema.safeParse({ ...base, fechaIngreso: "15/01/2026" }).success).toBe(false);
  });

  it("rechaza etapa o estado fuera de los valores permitidos", () => {
    expect(filaEmprendedorSchema.safeParse({ ...base, etapa: "Graduado" }).success).toBe(false);
    expect(filaEmprendedorSchema.safeParse({ ...base, estado: "Pendiente" }).success).toBe(false);
  });

  it("rechaza campos obligatorios vacíos", () => {
    expect(filaEmprendedorSchema.safeParse({ ...base, nombre: "" }).success).toBe(false);
    expect(filaEmprendedorSchema.safeParse({ ...base, telefono: "" }).success).toBe(false);
  });
});
