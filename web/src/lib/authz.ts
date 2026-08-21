import { auth } from "@/auth";
import type { Rol } from "@/types/next-auth";

export class AuthzError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Sesión autenticada, o lanza 401. Usar al inicio de cada route handler protegido. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthzError("No autenticado", 401);
  }
  return session;
}

/** Sesión autenticada y con uno de los roles permitidos, o lanza 401/403. */
export async function requireRole(...roles: Rol[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.rol)) {
    throw new AuthzError("No autorizado para esta acción", 403);
  }
  return session;
}

/** Verifica que el Emprendedor autenticado solo acceda a su propio registro. */
export function requireOwnEmprendedor(session: { user: { rol: Rol; emprendedorId: string | null } }, emprendedorId: string) {
  if (session.user.rol === "EMPRENDEDOR" && session.user.emprendedorId !== emprendedorId) {
    throw new AuthzError("No autorizado para consultar información de otro emprendedor", 403);
  }
}
