import Link from "next/link";
import { Card } from "@/components/Card";
import { RecuperarAccesoForm } from "./RecuperarAccesoForm";

export default function RecuperarAccesoPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <header>
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--brand-primary)" }}
        >
          Unidad de Innovación y Emprendimiento
        </p>
        <h1
          className="mt-1 text-2xl font-bold"
          style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}
        >
          Recuperar acceso
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Escribe tu correo. Un Administrador revisará tu solicitud y te dará una nueva contraseña.
        </p>
      </header>

      <Card title="¿Olvidaste tu contraseña?">
        <RecuperarAccesoForm />
      </Card>

      <Link
        href="/login"
        className="text-center text-sm font-medium"
        style={{ color: "var(--brand-primary)" }}
      >
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
