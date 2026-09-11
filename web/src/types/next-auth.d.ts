import type { DefaultSession } from "next-auth";

export type Rol = "ADMINISTRADOR" | "DOCENTE" | "COORDINADOR" | "EMPRENDEDOR";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
      emprendedorId: string | null;
      debeCambiarPassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    rol: Rol;
    emprendedorId: string | null;
    debeCambiarPassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
    emprendedorId: string | null;
    debeCambiarPassword: boolean;
  }
}
