import { ReunionesExplorer } from "@/components/ReunionesExplorer";
import { getAllReuniones, getEmprendedores } from "@/lib/queries";

export default async function ReunionesPage() {
  const [emprendedores, reuniones] = await Promise.all([getEmprendedores(), getAllReuniones()]);

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
          Reuniones
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Calendario de reuniones — programa, reagenda o cancela por emprendedor.
        </p>
      </header>

      <ReunionesExplorer emprendedores={emprendedores} reuniones={reuniones} />
    </main>
  );
}
