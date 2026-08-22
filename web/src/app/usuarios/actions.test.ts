import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { limpiarDb } from "@/test/db";
import { SEDES } from "@/lib/validation/usuario";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { registrarUsuario, editarUsuario, toggleActivoUsuario, restablecerPasswordUsuario, otorgarAccesoPortal } =
  await import("./actions");

async function crearAdminDeTest() {
  return prisma.usuario.create({
    data: { nombre: "Admin Test", correo: `admin-${Math.random()}@test.com`, passwordHash: "x", rol: "ADMINISTRADOR" },
  });
}

function sesionAdmin(usuario: { id: string; nombre: string }) {
  return { user: { id: usuario.id, rol: "ADMINISTRADOR" as const, emprendedorId: null, name: usuario.nombre } };
}

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(async () => {
  await limpiarDb();
  mockAuth.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("registrarUsuario", () => {
  it("rechaza si el rol no es Administrador", async () => {
    mockAuth.mockResolvedValue({ user: { id: "x", rol: "COORDINADOR", emprendedorId: null } });
    const r = await registrarUsuario(
      {},
      fd({ nombre: "N", correo: "n@test.com", password: "12345678", rol: "DOCENTE", sede: SEDES[0] })
    );
    expect(r.error).toMatch(/No autorizado/);
    expect(await prisma.usuario.count()).toBe(0);
  });

  it("crea un Docente con sede y deja auditoría con origen ADMINISTRACION", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    const r = await registrarUsuario(
      {},
      fd({ nombre: "Docente Nuevo", correo: "docente.nuevo@test.com", password: "12345678", rol: "DOCENTE", sede: SEDES[1] })
    );

    expect(r.success).toBe(true);
    const creado = await prisma.usuario.findUnique({ where: { correo: "docente.nuevo@test.com" } });
    expect(creado?.rol).toBe("DOCENTE");
    expect(creado?.sede).toBe(SEDES[1]);

    const log = await prisma.auditLog.findFirst({ where: { entidad: "Usuario", accion: "CREATE" } });
    expect(log?.origen).toBe("ADMINISTRACION");
  });

  it("crea un Administrador o Coordinador sin sede (queda null)", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    await registrarUsuario({}, fd({ nombre: "Coord", correo: "coord@test.com", password: "12345678", rol: "COORDINADOR" }));

    const creado = await prisma.usuario.findUnique({ where: { correo: "coord@test.com" } });
    expect(creado?.rol).toBe("COORDINADOR");
    expect(creado?.sede).toBeNull();
  });

  it("rechaza un Docente sin sede (validación del schema)", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    const r = await registrarUsuario({}, fd({ nombre: "N", correo: "n2@test.com", password: "12345678", rol: "DOCENTE" }));

    expect(r.error).toBeDefined();
    expect(await prisma.usuario.count()).toBe(1); // solo el admin de test
  });

  it("rechaza un correo ya registrado", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    const r = await registrarUsuario(
      {},
      fd({ nombre: "Otro", correo: admin.correo, password: "12345678", rol: "DOCENTE", sede: SEDES[0] })
    );

    expect(r.error).toMatch(/Ya existe/);
  });
});

describe("editarUsuario", () => {
  it("actualiza nombre, correo, rol y sede, y deja auditoría con antes/después", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const docente = await prisma.usuario.create({
      data: { nombre: "Original", correo: "original@test.com", passwordHash: "x", rol: "DOCENTE", sede: SEDES[0] },
    });

    const r = await editarUsuario(
      {},
      fd({ id: docente.id, nombre: "Editado", correo: "editado@test.com", rol: "COORDINADOR" })
    );

    expect(r.success).toBe(true);
    const actualizado = await prisma.usuario.findUnique({ where: { id: docente.id } });
    expect(actualizado?.nombre).toBe("Editado");
    expect(actualizado?.rol).toBe("COORDINADOR");
    expect(actualizado?.sede).toBeNull(); // ya no es Docente

    const log = await prisma.auditLog.findFirst({ where: { entidad: "Usuario", entidadId: docente.id, accion: "UPDATE" } });
    expect(log?.valorAnterior).toMatchObject({ nombre: "Original", rol: "DOCENTE" });
    expect(log?.valorNuevo).toMatchObject({ nombre: "Editado", rol: "COORDINADOR" });
  });

  it("rechaza editar una cuenta de portal (rol EMPRENDEDOR)", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const emprendedor = await prisma.emprendedor.create({
      data: {
        nombre: "E", emprendimiento: "E", sector: "S", etapa: "Descubrir", estado: "Activo",
        fechaIngreso: new Date(), correo: "e@test.com", telefono: "300",
      },
    });
    const cuenta = await prisma.usuario.create({
      data: { nombre: "E", correo: "e@test.com", passwordHash: "x", rol: "EMPRENDEDOR", emprendedorId: emprendedor.id },
    });

    const r = await editarUsuario({}, fd({ id: cuenta.id, nombre: "Hackeado", correo: "e@test.com", rol: "ADMINISTRADOR" }));

    expect(r.error).toMatch(/portal/);
    const sinCambios = await prisma.usuario.findUnique({ where: { id: cuenta.id } });
    expect(sinCambios?.rol).toBe("EMPRENDEDOR");
  });

  it("rechaza un correo que ya pertenece a otro usuario", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const a = await prisma.usuario.create({ data: { nombre: "A", correo: "a@test.com", passwordHash: "x", rol: "DOCENTE", sede: SEDES[0] } });
    await prisma.usuario.create({ data: { nombre: "B", correo: "b@test.com", passwordHash: "x", rol: "DOCENTE", sede: SEDES[0] } });

    const r = await editarUsuario({}, fd({ id: a.id, nombre: "A", correo: "b@test.com", rol: "DOCENTE", sede: SEDES[0] }));

    expect(r.error).toMatch(/ya pertenece/);
  });
});

describe("toggleActivoUsuario", () => {
  it("desactiva y reactiva un usuario", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const docente = await prisma.usuario.create({
      data: { nombre: "D", correo: "d@test.com", passwordHash: "x", rol: "DOCENTE", sede: SEDES[0], activo: true },
    });

    await toggleActivoUsuario({}, fd({ id: docente.id }));
    expect((await prisma.usuario.findUnique({ where: { id: docente.id } }))?.activo).toBe(false);

    await toggleActivoUsuario({}, fd({ id: docente.id }));
    expect((await prisma.usuario.findUnique({ where: { id: docente.id } }))?.activo).toBe(true);
  });

  it("un Administrador no puede desactivarse a sí mismo", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    const r = await toggleActivoUsuario({}, fd({ id: admin.id }));

    expect(r.error).toMatch(/propia cuenta/);
    expect((await prisma.usuario.findUnique({ where: { id: admin.id } }))?.activo).toBe(true);
  });
});

describe("restablecerPasswordUsuario", () => {
  it("genera una contraseña temporal que sí funciona con el hash guardado, y nunca la audita en claro", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const docente = await prisma.usuario.create({
      data: { nombre: "D", correo: "d2@test.com", passwordHash: "hash-viejo", rol: "DOCENTE", sede: SEDES[0] },
    });

    const r = await restablecerPasswordUsuario({}, fd({ id: docente.id }));

    expect(r.passwordTemporal).toBeDefined();
    const actualizado = await prisma.usuario.findUnique({ where: { id: docente.id } });
    expect(await bcrypt.compare(r.passwordTemporal!, actualizado!.passwordHash)).toBe(true);

    const log = await prisma.auditLog.findFirst({ where: { entidad: "Usuario", entidadId: docente.id, accion: "UPDATE" } });
    expect(JSON.stringify(log?.valorNuevo)).not.toContain(r.passwordTemporal);
    expect(log?.valorNuevo).toEqual({ passwordReset: true });
  });
});

describe("otorgarAccesoPortal", () => {
  it("crea una cuenta EMPRENDEDOR vinculada, usando el correo del emprendedor", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const emprendedor = await prisma.emprendedor.create({
      data: {
        nombre: "Ana", emprendimiento: "EcoBolsas", sector: "Ambiental", etapa: "Descubrir", estado: "Activo",
        fechaIngreso: new Date(), correo: "ana.portal@test.com", telefono: "300",
      },
    });

    const r = await otorgarAccesoPortal({}, fd({ emprendedorId: emprendedor.id }));

    expect(r.passwordTemporal).toBeDefined();
    const cuenta = await prisma.usuario.findUnique({ where: { emprendedorId: emprendedor.id } });
    expect(cuenta?.rol).toBe("EMPRENDEDOR");
    expect(cuenta?.correo).toBe("ana.portal@test.com");
  });

  it("rechaza si el emprendedor ya tiene cuenta de portal", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));
    const emprendedor = await prisma.emprendedor.create({
      data: {
        nombre: "Ana", emprendimiento: "E", sector: "S", etapa: "Descubrir", estado: "Activo",
        fechaIngreso: new Date(), correo: "ana2@test.com", telefono: "300",
      },
    });
    await prisma.usuario.create({
      data: { nombre: "Ana", correo: "ana2@test.com", passwordHash: "x", rol: "EMPRENDEDOR", emprendedorId: emprendedor.id },
    });

    const r = await otorgarAccesoPortal({}, fd({ emprendedorId: emprendedor.id }));

    expect(r.error).toMatch(/ya tiene una cuenta/);
    expect(await prisma.usuario.count({ where: { emprendedorId: emprendedor.id } })).toBe(1);
  });

  it("rechaza si el emprendedor no existe", async () => {
    const admin = await crearAdminDeTest();
    mockAuth.mockResolvedValue(sesionAdmin(admin));

    const r = await otorgarAccesoPortal({}, fd({ emprendedorId: "no-existe" }));

    expect(r.error).toMatch(/ya no existe/);
  });
});
