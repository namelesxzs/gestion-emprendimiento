import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCohortes, getFases, getInstrumentos, getUsuarios } from "@/lib/queries";
import { SEDES } from "@/lib/validation/usuario";
import { RutaExplorer } from "@/components/RutaExplorer";
import { ExportarFormatos } from "@/components/ExportarFormatos";

export default async function RutaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const esPersonal = session.user.rol !== "EMPRENDEDOR";
  const [fases, instrumentos, cohortes, usuarios] = await Promise.all([
    getFases(true),
    getInstrumentos(true),
    esPersonal ? getCohortes() : Promise.resolve([]),
    esPersonal ? getUsuarios() : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Mesa Universitaria de Emprendimiento (MEUNE) · Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Ruta de Emprendimiento
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Fases y formatos del Manual de Formatos y Metodologías FUMC activos hoy — cada fase que ves como pestaña la
          activó el Administrador desde <code>/configuracion</code>.
        </p>
      </header>

      <RutaExplorer fases={fases} instrumentos={instrumentos} />

      {esPersonal && (
        <ExportarFormatos
          cohortes={cohortes.map((c) => ({ id: c.id, nombre: c.nombre }))}
          sedes={SEDES}
          asesores={usuarios.filter((u) => u.rol === "DOCENTE").map((u) => ({ id: u.id, nombre: u.nombre }))}
        />
      )}
    </main>
  );
}
