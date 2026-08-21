import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { ImportarExcel } from "@/components/ImportarExcel";

export default async function ImportarPage() {
  const session = await auth();
  if (!session?.user || (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "DOCENTE")) {
    redirect("/");
  }

  const importaciones = await prisma.importRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { usuario: { select: { nombre: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Importar Excel
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Carga masiva o incremental de emprendedores desde la plantilla oficial. Nunca sobrescribe el historial de
          acompañamientos, compromisos o reuniones.
        </p>
      </header>

      <ImportarExcel />

      {importaciones.length > 0 && (
        <Card title="Historial de importaciones" subtitle="Últimas 10 corridas">
          <div className="flex flex-col gap-2">
            {importaciones.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div>
                  <p style={{ color: "var(--text-primary)" }}>{run.archivoNombre}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {run.usuario.nombre} · {run.createdAt.toLocaleString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span>{run.nuevos} nuevos</span>
                  <span>{run.actualizados} actualizados</span>
                  <span>{run.sinCambios} sin cambios</span>
                  <span>{run.errores} errores</span>
                  <EstadoRunBadge estado={run.estado} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function EstadoRunBadge({ estado }: { estado: string }) {
  const color =
    estado === "CONFIRMADO"
      ? "var(--status-good)"
      : estado === "FALLIDO"
        ? "var(--status-critical)"
        : "var(--status-warning)";
  return (
    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {estado}
    </span>
  );
}
