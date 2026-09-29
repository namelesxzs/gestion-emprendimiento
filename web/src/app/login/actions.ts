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
