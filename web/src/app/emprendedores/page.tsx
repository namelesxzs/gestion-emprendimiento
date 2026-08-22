import { redirect } from "next/navigation";
import { EmprendedoresExplorer } from "@/components/EmprendedoresExplorer";
import { auth } from "@/auth";
import { getAllAcompanamientos, getAllReuniones, getEmprendedores, getEmprendedorIdsConPortal } from "@/lib/queries";
import { getUltimoAvance } from "@/lib/view";

export default async function EmprendedoresPage() {
  const session = await auth();

  // RF13: esta vista lista a todos los emprendedores — un Emprendedor no
  // debe verla, su propio perfil ya está en el Dashboard.
  if (session?.user.rol === "EMPRENDEDOR") {
    redirect("/");
  }

  const [emprendedores, acompanamientos, reuniones, emprendedorIdsConPortal] = await Promise.all([
    getEmprendedores(),
    getAllAcompanamientos(),
    getAllReuniones(),
    getEmprendedorIdsConPortal(),
  ]);

  const rows = emprendedores.map((e) => ({
    ...e,
    avance: getUltimoAvance(acompanamientos, e.id),
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

      <EmprendedoresExplorer
        rows={rows}
        acompanamientos={acompanamientos}
        reuniones={reuniones}
        emprendedorIdsConPortal={emprendedorIdsConPortal}
      />
    </main>
  );
}
