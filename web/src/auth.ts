import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        correo: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const correo = typeof credentials?.correo === "string" ? credentials.correo : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!correo || !password) return null;

        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario || !usuario.activo) return null;

        const valido = await bcrypt.compare(password, usuario.passwordHash);
        if (!valido) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol as "ADMINISTRADOR" | "DOCENTE" | "COORDINADOR" | "EMPRENDEDOR",
          emprendedorId: usuario.emprendedorId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.rol = user.rol;
        token.emprendedorId = user.emprendedorId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.rol = token.rol as Session["user"]["rol"];
      session.user.emprendedorId = token.emprendedorId as string | null;
      return session;
    },
  },
});
