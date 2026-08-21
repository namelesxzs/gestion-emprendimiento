import { AcompanamientosExplorer } from "@/components/AcompanamientosExplorer";
import { auth } from "@/auth";
import { getAllAcompanamientos, getEmprendedores } from "@/lib/queries";

export default async function AcompanamientosPage() {
  const session = await auth();
  // RF13: un Emprendedor solo ve su propio historial — se pide solo lo
  // suyo a la base, la consulta nunca trae datos de otros.
  const soloPropio = session?.user.rol === "EMPRENDEDOR" ? session.user.emprendedorId ?? undefined : undefined;

  const [emprendedores, acompanamientos] = await Promise.all([
    getEmprendedores(soloPropio),
    getAllAcompanamientos(soloPropio),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
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
          {soloPropio ? "Mi historial" : "Acompañamientos"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {soloPropio
            ? "Tu historial evolutivo, tipo historial clínico."
            : "Historial evolutivo por emprendedor, tipo historial clínico."}
        </p>
      </header>

      <AcompanamientosExplorer emprendedores={emprendedores} acompanamientos={acompanamientos} />
    </main>
  );
}
