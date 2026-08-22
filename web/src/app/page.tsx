import { StatTile } from "@/components/StatTile";
import { Card } from "@/components/Card";
import { EtapaBarChart } from "@/components/EtapaBarChart";
import { EmprendedoresTable } from "@/components/EmprendedoresTable";
import { ProximasReuniones } from "@/components/ProximasReuniones";
import { MiPerfilDashboard } from "@/components/MiPerfilDashboard";
import { IndicadoresDashboard } from "@/components/IndicadoresDashboard";
import { auth } from "@/auth";
import {
  getAllAcompanamientos,
  getAllCompromisos,
  getAllReuniones,
  getEmprendedores,
  getEmprendedoresPorSede,
} from "@/lib/queries";
import { getEtapaDistribution, getKpis, getProximasReuniones, getUltimoAvance } from "@/lib/view";

export default async function Home() {
  const session = await auth();

  // RF13: un Emprendedor solo consulta su propio progreso, nunca el
  // panel institucional completo — se pide solo su propio dato, no se
  // filtra después de traer todo.
  if (session?.user.rol === "EMPRENDEDOR" && session.user.emprendedorId) {
    const [emprendedores, acompanamientos, reuniones] = await Promise.all([
      getEmprendedores(session.user.emprendedorId),
      getAllAcompanamientos(session.user.emprendedorId),
      getAllReuniones(session.user.emprendedorId),
    ]);
    const emprendedor = emprendedores[0];

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
            Unidad de Innovación y Emprendimiento
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
            Mi progreso
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Tu avance por la cadena de valor y tus próximas reuniones.
          </p>
        </header>

        {emprendedor ? (
          <MiPerfilDashboard emprendedor={emprendedor} acompanamientos={acompanamientos} reuniones={reuniones} />
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tu cuenta no está vinculada a ningún registro de emprendedor todavía.
          </p>
        )}
      </main>
    );
  }

  // Fase 6: Coordinador y Administrador supervisan la institución, no la
  // operación día a día — reciben el panel de indicadores puro en vez del
  // dashboard operativo (tabla de emprendedores + próximas reuniones).
  if (session?.user.rol === "COORDINADOR" || session?.user.rol === "ADMINISTRADOR") {
    const [emprendedores, acompanamientos, reuniones, compromisos, emprendedoresPorSede] = await Promise.all([
      getEmprendedores(),
      getAllAcompanamientos(),
      getAllReuniones(),
      getAllCompromisos(),
      getEmprendedoresPorSede(),
    ]);

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
            Unidad de Innovación y Emprendimiento
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}>
            Indicadores institucionales
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Vista de solo indicadores — para operación día a día, ve a Emprendedores,
            Acompañamientos o Reuniones.
          </p>
        </header>

        <IndicadoresDashboard
          emprendedores={emprendedores}
          acompanamientos={acompanamientos}
          reuniones={reuniones}
          compromisos={compromisos}
          emprendedoresPorSede={emprendedoresPorSede}
        />
      </main>
    );
  }

  const [emprendedores, acompanamientos, reuniones] = await Promise.all([
    getEmprendedores(),
    getAllAcompanamientos(),
    getAllReuniones(),
  ]);

  const kpis = getKpis(emprendedores, acompanamientos);
  const distribucion = getEtapaDistribution(emprendedores);
  const proximasReuniones = getProximasReuniones(reuniones, emprendedores);
  const filasEmprendedores = emprendedores.map((e) => ({
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
          Acompañamiento a Emprendedores
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Vista general del proceso de acompañamiento y avance por la cadena de valor
          (Descubrir · Incubar · Formar · Fomentar · Financiar).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total emprendedores"
          value={kpis.totalEmprendedores}
          accent="var(--etapa-descubrir)"
        />
        <StatTile
          label="Emprendedores activos"
          value={kpis.activos}
          accent="var(--status-good)"
        />
        <StatTile
          label="Acompañamientos realizados"
          value={kpis.totalAcompanamientos}
          accent="var(--etapa-formar)"
        />
        <StatTile
          label="Avance promedio"
          value={`${kpis.avancePromedio}%`}
          accent="var(--etapa-fomentar)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card
            title="Emprendedores por etapa"
            subtitle="Distribución sobre la cadena de valor institucional"
          >
            <EtapaBarChart data={distribucion} />
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card title="Próximas reuniones" subtitle="Programadas o reagendadas">
            <ProximasReuniones reuniones={proximasReuniones} />
          </Card>
        </div>
      </div>

      <Card title="Emprendedores" subtitle="Listado con la última medición de avance registrada">
        <EmprendedoresTable rows={filasEmprendedores} />
      </Card>
    </main>
  );
}
