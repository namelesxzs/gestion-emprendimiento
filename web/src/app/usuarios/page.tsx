import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUsuarios } from "@/lib/queries";
import { UsuariosExplorer } from "@/components/UsuariosExplorer";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMINISTRADOR") {
    redirect("/");
  }

  const usuarios = await getUsuarios();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Usuarios
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Cuentas de personal UIE (Administrador, Docente, Coordinador). Las cuentas de portal de los emprendedores
          se dan de alta desde su propio registro en Emprendedores.
        </p>
      </header>

      <UsuariosExplorer usuarios={usuarios} />
    </main>
  );
}
