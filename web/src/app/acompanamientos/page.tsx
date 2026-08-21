import { AcompanamientosExplorer } from "@/components/AcompanamientosExplorer";
import { getAllAcompanamientos, getEmprendedores } from "@/lib/queries";

export default async function AcompanamientosPage() {
  const [emprendedores, acompanamientos] = await Promise.all([
    getEmprendedores(),
    getAllAcompanamientos(),
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
          Acompañamientos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Historial evolutivo por emprendedor, tipo historial clínico.
        </p>
      </header>

      <AcompanamientosExplorer emprendedores={emprendedores} acompanamientos={acompanamientos} />
    </main>
  );
}
