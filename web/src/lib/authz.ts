import { auth } from "@/auth";
import type { Rol } from "@/types/next-auth";

export class AuthzError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthzError("No autenticado", 401);
  }
  return session;
}

export async function requireRole(...roles: Rol[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.rol)) {
    throw new AuthzError("No autorizado para esta acción", 403);
  }
  return session;
}

export function requireOwnEmprendedor(session: { user: { rol: Rol; emprendedorId: string | null } }, emprendedorId: string) {
  if (session.user.rol === "EMPRENDEDOR" && session.user.emprendedorId !== emprendedorId) {
    throw new AuthzError("No autorizado para consultar información de otro emprendedor", 403);
  }
}
