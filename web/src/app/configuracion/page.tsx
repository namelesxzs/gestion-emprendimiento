import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEtapasCatalogo, getFases, getInstrumentos, getReglasAvance } from "@/lib/queries";
import { ConfiguracionExplorer } from "@/components/ConfiguracionExplorer";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMINISTRADOR") {
    redirect("/");
  }

  const [fases, etapas, instrumentos, reglas] = await Promise.all([
    getFases(),
    getEtapasCatalogo(),
    getInstrumentos(),
    getReglasAvance(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Configuración de la Ruta
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Catálogo configurable del Manual FUMC (fases, etapas e instrumentos) — activa, desactiva y ajusta sin
          necesitar un cambio de código. Ver <code>/ruta</code> para lo que ven los demás roles.
        </p>
      </header>

      <ConfiguracionExplorer fases={fases} etapas={etapas} instrumentos={instrumentos} reglas={reglas} />
    </main>
  );
}
