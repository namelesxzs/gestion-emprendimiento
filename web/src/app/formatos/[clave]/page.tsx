import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CampoInstrumentoDef, FirmaValor } from "@/lib/catalogo/tipos";
import { BotonImprimir } from "@/components/BotonImprimir";

const celda = "border px-3 py-2 align-top";
const borde = { borderColor: "#9aa5b1" } as const;

function texto(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function ValorCampo({ campo, datos }: { campo: CampoInstrumentoDef; datos: Record<string, unknown> | null }) {
  const valor = datos?.[campo.clave];

  if (campo.tipo === "tabla") {
    const columnas = campo.columnas ?? [];
    const filas = Array.isArray(valor) ? (valor as Record<string, unknown>[]) : [];
    const fijas = campo.filas ?? [];
    const cuerpo = fijas.length
      ? fijas.map((f) => ({ key: f.clave, etiqueta: f.etiqueta, descripcion: f.descripcion, fila: filas.find((x) => x.fila === f.clave) }))
      : (filas.length ? filas : Array.from({ length: campo.filasIniciales ?? 3 }, () => undefined)).map((fila, i) => ({
          key: String(i),
          etiqueta: null,
          descripcion: undefined,
          fila,
        }));
    return (
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {fijas.length > 0 && <th className={`${celda} text-left`} style={borde}>Criterio</th>}
            {columnas.map((c) => (
              <th key={c.clave} className={`${celda} text-left`} style={borde}>
                {c.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuerpo.map((r) => (
            <tr key={r.key}>
              {fijas.length > 0 && (
                <td className={celda} style={borde}>
                  <strong>{r.etiqueta}</strong>
                  {r.descripcion && <div className="text-xs">{r.descripcion}</div>}
                </td>
              )}
              {columnas.map((c) => (
                <td key={c.clave} className={`${celda} h-9 whitespace-pre-wrap`} style={borde}>
                  {texto(r.fila?.[c.clave])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (campo.tipo === "firma") {
    const firma = (valor ?? null) as FirmaValor | null;
    if (!firma) return <div className="h-10" />;
    return (
      <div>
        <p className="font-semibold">{firma.nombre}</p>
        <p className="text-xs">
          Firmado electrónicamente en la plataforma por {firma.firmadoPorNombre} ({firma.firmadoPorRol.toLowerCase()}) el{" "}
          {new Date(firma.fecha).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>
    );
  }

  if (campo.tipo === "total") {
    return (
      <span className="font-semibold">
        {datos ? texto(valor) : ""}
        {campo.max !== undefined && ` / ${campo.max}`}
      </span>
    );
  }

  const opciones = campo.tipo === "seleccion" && !datos && campo.opciones?.length ? `(${campo.opciones.join(" / ")})` : "";
  return (
    <div className={`whitespace-pre-wrap ${campo.tipo === "textarea" ? "min-h-16" : "min-h-6"}`}>
      {texto(valor) || <span className="text-xs text-gray-500">{opciones}</span>}
    </div>
  );
}

export default async function FormatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ clave: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { clave } = await params;
  const { respuesta: respuestaParam } = await searchParams;

  const instrumento = await prisma.instrumento.findUnique({ where: { clave }, include: { fase: true } });
  if (!instrumento) notFound();

  let respuesta = null;
  if (typeof respuestaParam === "string") {
    respuesta = await prisma.instrumentoRespuesta.findUnique({
      where: { id: respuestaParam },
      include: {
        emprendedor: true,
        registradoPor: { select: { nombre: true } },
        revisadoPor: { select: { nombre: true } },
      },
    });
    if (!respuesta || respuesta.instrumentoId !== instrumento.id) notFound();
    if (session.user.rol === "EMPRENDEDOR" && session.user.emprendedorId !== respuesta.emprendedorId) notFound();
  }

  const campos = (instrumento.camposSchema as unknown as CampoInstrumentoDef[]) ?? [];
  const datos = (respuesta?.datos as Record<string, unknown> | undefined) ?? null;
  const anchoCompleto = (c: CampoInstrumentoDef) => c.tipo === "tabla";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 text-[#1f2933] print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-4 flex justify-end">
        <BotonImprimir />
      </div>

      <header className="mb-4 border-b-2 pb-3" style={{ borderColor: "#003366" }}>
        <p className="text-xs font-semibold uppercase tracking-wide">Fundación Universitaria María Cano</p>
        <p className="text-xs">Ruta de Emprendimiento — Mesa Universitaria de Emprendimiento (MEUNE)</p>
        <h1 className="mt-2 text-xl font-bold" style={{ color: "#003366", fontFamily: "var(--font-brand)" }}>
          {instrumento.origenManual ? `${instrumento.origenManual} · ` : ""}
          {instrumento.nombre}
        </h1>
        <p className="text-sm">
          Fase: {instrumento.transversal ? "Transversal (pre-incubación e incubación)" : (instrumento.fase?.nombre ?? "—")} ·{" "}
          {instrumento.momento ?? "—"}
        </p>
        <p className="text-xs">
          Diligencia: {instrumento.responsableDiligencia ?? "—"} · Revisa: {instrumento.responsableRevisa ?? "—"}
        </p>
      </header>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <th className={`${celda} w-1/3 text-left`} style={borde}>
              Emprendimiento
            </th>
            <td className={celda} style={borde}>
              {respuesta ? `${respuesta.emprendedor.emprendimiento} — ${respuesta.emprendedor.nombre}` : ""}
            </td>
          </tr>
          {campos.map((c) =>
            anchoCompleto(c) ? (
              <tr key={c.clave}>
                <td colSpan={2} className={celda} style={borde}>
                  <p className="mb-2 font-semibold">{c.etiqueta}</p>
                  <ValorCampo campo={c} datos={datos} />
                </td>
              </tr>
            ) : (
              <tr key={c.clave}>
                <th className={`${celda} w-1/3 text-left font-semibold`} style={borde}>
                  {c.etiqueta}
                </th>
                <td className={celda} style={borde}>
                  <ValorCampo campo={c} datos={datos} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {respuesta && (
        <footer className="mt-4 text-xs">
          Registro diligenciado en la plataforma por {respuesta.registradoPor.nombre} — última actualización{" "}
          {respuesta.updatedAt.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })}. Estado de revisión:{" "}
          {respuesta.estadoRevision}
          {respuesta.revisadoPor && ` por ${respuesta.revisadoPor.nombre}`}
          {respuesta.revisadoEn && ` el ${respuesta.revisadoEn.toLocaleDateString("es-CO", { dateStyle: "long" })}`}
          {respuesta.comentarioRevision && ` — "${respuesta.comentarioRevision}"`}.
        </footer>
      )}
    </main>
  );
}
