import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFases, getInstrumentos } from "@/lib/queries";
import { RutaExplorer } from "@/components/RutaExplorer";

export default async function RutaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [fases, instrumentos] = await Promise.all([getFases(true), getInstrumentos(true)]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Ruta de Emprendimiento
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Fases y formatos del Manual FUMC activos hoy — cada fase que ves como pestaña la activó el Administrador
          desde <code>/configuracion</code>.
        </p>
      </header>

      <RutaExplorer fases={fases} instrumentos={instrumentos} />
    </main>
  );
}
