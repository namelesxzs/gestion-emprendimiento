"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginBloqueado, MINUTOS_BLOQUEO } from "@/lib/loginRateLimit";

export type LoginState = { error?: string; success?: boolean };

export async function authenticate(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const correo = formData.get("correo");

  if (typeof correo === "string" && correo && (await loginBloqueado(correo))) {
    return {
      error: `Demasiados intentos fallidos con este correo. Espera ${MINUTOS_BLOQUEO} minutos e intenta de nuevo.`,
    };
  }

  try {
    await signIn("credentials", {
      correo,
      password: formData.get("password"),
      // redirect: false — el redirect lo hace el cliente con una recarga
      // completa (ver LoginForm), no Next.js con una transición interna.
      // De lo contrario el layout raíz no se vuelve a ejecutar en servidor
      // y la sesión mostrada queda desfasada hasta un F5 manual.
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error;
  }
}
