"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthzError } from "@/lib/authz";
import { registrarAuditoria } from "@/lib/audit";
import { usuarioCreateSchema, usuarioUpdateSchema } from "@/lib/validation/usuario";
import { generarPasswordTemporal } from "@/lib/password";

export type RegistrarUsuarioState = { error?: string; success?: boolean };

export async function registrarUsuario(
  _prevState: RegistrarUsuarioState,
  formData: FormData
): Promise<RegistrarUsuarioState> {
  let session;
  try {
    // Solo Administrador da de alta cuentas de personal UIE.
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = usuarioCreateSchema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    sede: formData.get("sede") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const yaExiste = await prisma.usuario.findUnique({ where: { correo: parsed.data.correo } });
  if (yaExiste) {
    return { error: "Ya existe un usuario registrado con ese correo." };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        passwordHash,
        rol: parsed.data.rol,
        sede: parsed.data.rol === "DOCENTE" ? parsed.data.sede : null,
      },
    });

    // Nunca se audita el hash ni la contraseña en claro.
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: usuario.id,
      accion: "CREATE",
      valorNuevo: { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, sede: usuario.sede },
    });
  } catch (error) {
    console.error("No se pudo registrar el usuario", error);
    return { error: "No se pudo registrar el usuario. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  return { success: true };
}

export type EditarUsuarioState = { error?: string; success?: boolean };

export async function editarUsuario(
  _prevState: EditarUsuarioState,
  formData: FormData
): Promise<EditarUsuarioState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const parsed = usuarioUpdateSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    rol: formData.get("rol"),
    sede: formData.get("sede") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.usuario.findUnique({ where: { id: parsed.data.id } });
  if (!actual) {
    return { error: "El usuario que intentas editar ya no existe." };
  }
  // Las cuentas de portal viven atadas a un Emprendedor puntual (ver
  // otorgarAccesoPortal) — no se gestionan desde este formulario genérico.
  if (actual.rol === "EMPRENDEDOR") {
    return { error: "Las cuentas de portal de emprendedores no se editan desde aquí." };
  }

  const correoEnUso = await prisma.usuario.findFirst({
    where: { correo: parsed.data.correo, NOT: { id: parsed.data.id } },
  });
  if (correoEnUso) {
    return { error: "Ese correo ya pertenece a otro usuario." };
  }

  try {
    const actualizado = await prisma.usuario.update({
      where: { id: parsed.data.id },
      data: {
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        rol: parsed.data.rol,
        sede: parsed.data.rol === "DOCENTE" ? parsed.data.sede : null,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: actualizado.id,
      accion: "UPDATE",
      valorAnterior: { nombre: actual.nombre, correo: actual.correo, rol: actual.rol, sede: actual.sede },
      valorNuevo: {
        nombre: actualizado.nombre,
        correo: actualizado.correo,
        rol: actualizado.rol,
        sede: actualizado.sede,
      },
    });
  } catch (error) {
    console.error("No se pudo editar el usuario", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  return { success: true };
}

export type ToggleActivoState = { error?: string; success?: boolean };

export async function toggleActivoUsuario(
  _prevState: ToggleActivoState,
  formData: FormData
): Promise<ToggleActivoState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Usuario inválido." };

  // Un Administrador nunca puede desactivarse a sí mismo — evita que la
  // institución se quede sin nadie que pueda revertirlo.
  if (id === session.user.id) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }

  const actual = await prisma.usuario.findUnique({ where: { id } });
  if (!actual) return { error: "El usuario ya no existe." };

  try {
    const actualizado = await prisma.usuario.update({ where: { id }, data: { activo: !actual.activo } });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: actualizado.id,
      accion: "UPDATE",
      valorAnterior: { activo: actual.activo },
      valorNuevo: { activo: actualizado.activo },
    });
  } catch (error) {
    console.error("No se pudo cambiar el estado del usuario", error);
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  return { success: true };
}

export type RestablecerPasswordState = { error?: string; passwordTemporal?: string };

export async function restablecerPasswordUsuario(
  _prevState: RestablecerPasswordState,
  formData: FormData
): Promise<RestablecerPasswordState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Usuario inválido." };

  const actual = await prisma.usuario.findUnique({ where: { id } });
  if (!actual) return { error: "El usuario ya no existe." };

  const passwordTemporal = generarPasswordTemporal();

  try {
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);
    await prisma.usuario.update({ where: { id }, data: { passwordHash } });

    // Nunca se guarda ni se audita la contraseña en claro — solo que hubo
    // un reset. passwordTemporal vive solo en memoria de esta request y en
    // lo que renderiza el cliente una vez; nunca se persiste en ningún lado.
    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: actual.id,
      accion: "UPDATE",
      valorNuevo: { passwordReset: true },
    });
  } catch (error) {
    console.error("No se pudo restablecer la contraseña", error);
    return { error: "No se pudo restablecer la contraseña. Intenta de nuevo." };
  }

  return { passwordTemporal };
}

export type OtorgarAccesoPortalState = { error?: string; passwordTemporal?: string };

export async function otorgarAccesoPortal(
  _prevState: OtorgarAccesoPortalState,
  formData: FormData
): Promise<OtorgarAccesoPortalState> {
  let session;
  try {
    session = await requireRole("ADMINISTRADOR");
  } catch (error) {
    if (error instanceof AuthzError) return { error: error.message };
    throw error;
  }

  const emprendedorId = formData.get("emprendedorId");
  if (typeof emprendedorId !== "string" || !emprendedorId) return { error: "Emprendedor inválido." };

  const emprendedor = await prisma.emprendedor.findUnique({ where: { id: emprendedorId } });
  if (!emprendedor) return { error: "El emprendedor ya no existe." };

  const yaTieneCuenta = await prisma.usuario.findUnique({ where: { emprendedorId } });
  if (yaTieneCuenta) return { error: "Este emprendedor ya tiene una cuenta de portal." };

  const correoEnUso = await prisma.usuario.findUnique({ where: { correo: emprendedor.correo } });
  if (correoEnUso) {
    return { error: "Ya existe una cuenta de usuario con ese correo — no se puede reutilizar." };
  }

  const passwordTemporal = generarPasswordTemporal();

  try {
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: emprendedor.nombre,
        correo: emprendedor.correo,
        passwordHash,
        rol: "EMPRENDEDOR",
        emprendedorId: emprendedor.id,
      },
    });

    await registrarAuditoria({
      usuarioId: session.user.id,
      rol: session.user.rol,
      origen: "ADMINISTRACION",
      entidad: "Usuario",
      entidadId: usuario.id,
      accion: "CREATE",
      valorNuevo: { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, emprendedorId },
    });
  } catch (error) {
    console.error("No se pudo dar acceso al portal", error);
    return { error: "No se pudo crear la cuenta de portal. Intenta de nuevo." };
  }

  revalidatePath("/emprendedores");
  return { passwordTemporal };
}
