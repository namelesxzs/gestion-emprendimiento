import { Card } from "@/components/Card";
import { CambiarPasswordForm } from "./CambiarPasswordForm";

export default function CambiarPasswordPage() {
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
          Crea tu contraseña
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tu contraseña actual es temporal. Antes de continuar, crea una nueva que solo tú conozcas.
        </p>
      </header>

      <Card title="Nueva contraseña">
        <CambiarPasswordForm />
      </Card>
    </main>
  );
}
