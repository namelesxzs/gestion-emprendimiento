import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuditLogs, getUsuariosBasico } from "@/lib/queries";
import { Card } from "@/components/Card";
import { AuditoriaFiltros } from "@/components/AuditoriaFiltros";
import { AuditLogTable } from "@/components/AuditLogTable";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMINISTRADOR") {
    redirect("/");
  }

  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const filtros = {
    entidad: uno(sp.entidad) || undefined,
    accion: uno(sp.accion) || undefined,
    origen: uno(sp.origen) || undefined,
    resultado: uno(sp.resultado) || undefined,
    usuarioId: uno(sp.usuarioId) || undefined,
    desde: uno(sp.desde) || undefined,
    hasta: uno(sp.hasta) || undefined,
  };
  const page = Number(uno(sp.page)) || 1;

  const [{ logs, total, pageSize }, usuarios] = await Promise.all([
    getAuditLogs(filtros, page),
    getUsuariosBasico(),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const paginaActual = Math.min(page, totalPaginas);

  const hrefPagina = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filtros)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `/auditoria?${params.toString()}`;
  };

  const desde = total === 0 ? 0 : (paginaActual - 1) * pageSize + 1;
  const hasta = Math.min(paginaActual * pageSize, total);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
          Unidad de Innovación y Emprendimiento
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
          Auditoría
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Registro de quién hizo qué, cuándo y desde dónde — cada alta, edición y confirmación de importación queda
          aquí.
        </p>
      </header>

      <AuditoriaFiltros usuarios={usuarios} filtros={filtros} />

      <Card
        title="Registros"
        subtitle={total === 0 ? "0 registros" : `Mostrando ${desde}–${hasta} de ${total} registros`}
      >
        <div className="flex flex-col gap-4">
          <AuditLogTable rows={logs} />

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-sm">
              {paginaActual > 1 ? (
                <a href={hrefPagina(paginaActual - 1)} style={{ color: "var(--brand-primary)" }} className="font-bold uppercase tracking-wide">
                  ← Anterior
                </a>
              ) : (
                <span />
              )}
              <span style={{ color: "var(--text-muted)" }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              {paginaActual < totalPaginas ? (
                <a href={hrefPagina(paginaActual + 1)} style={{ color: "var(--brand-primary)" }} className="font-bold uppercase tracking-wide">
                  Siguiente →
                </a>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
