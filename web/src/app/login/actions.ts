"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      correo: formData.get("correo"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Correo o contraseña incorrectos.";
    }
    throw error;
  }
}
