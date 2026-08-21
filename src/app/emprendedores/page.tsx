import { EmprendedoresExplorer } from "@/components/EmprendedoresExplorer";
import { emprendedores, getUltimoAvance } from "@/lib/mock-data";

export default function EmprendedoresPage() {
  const rows = emprendedores.map((e) => ({
    ...e,
    avance: getUltimoAvance(e.id),
  }));

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
          Emprendedores
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Filtra por etapa o estado y selecciona un emprendedor para ver su detalle.
        </p>
      </header>

      <EmprendedoresExplorer rows={rows} />
    </main>
  );
}
