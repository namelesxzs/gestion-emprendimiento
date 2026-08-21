import { ReunionesExplorer } from "@/components/ReunionesExplorer";
import { auth } from "@/auth";
import { getAllReuniones, getEmprendedores } from "@/lib/queries";

export default async function ReunionesPage() {
  const session = await auth();
  // RF13: un Emprendedor solo ve sus propias reuniones.
  const soloPropio = session?.user.rol === "EMPRENDEDOR" ? session.user.emprendedorId ?? undefined : undefined;

  const [emprendedores, reuniones] = await Promise.all([
    getEmprendedores(soloPropio),
    getAllReuniones(soloPropio),
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
          {soloPropio ? "Mis reuniones" : "Reuniones"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {soloPropio
            ? "Tus reuniones programadas, reagendadas o realizadas."
            : "Calendario de reuniones — programa, reagenda o cancela por emprendedor."}
        </p>
      </header>

      <ReunionesExplorer emprendedores={emprendedores} reuniones={reuniones} />
    </main>
  );
}
