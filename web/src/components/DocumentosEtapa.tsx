"use client";

import { useActionState, useState } from "react";
import {
  subirDocumento,
  revisarDocumento,
  type SubirDocumentoState,
  type RevisarDocumentoState,
} from "@/app/documentos/actions";
import type { Documento, Etapa } from "@/lib/types";
import { Card } from "./Card";
import { EstadoDocumentoBadge } from "./EstadoDocumentoBadge";

const initialSubirState: SubirDocumentoState = {};
const initialRevisarState: RevisarDocumentoState = {};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SubirDocumentoForm({ emprendedorId }: { emprendedorId: string }) {
  const [state, formAction, isPending] = useActionState(subirDocumento, initialSubirState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-md border p-3"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <input type="hidden" name="emprendedorId" value={emprendedorId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="archivo" className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Documento (PDF, Word, PNG o JPG · máx. 10MB)
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          required
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {isPending ? "Subiendo..." : "Subir documento"}
      </button>
      {state.error && (
        <p className="w-full text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function RevisarDocumentoRow({ documento }: { documento: Documento }) {
  const [state, formAction, isPending] = useActionState(revisarDocumento, initialRevisarState);
  const [decision, setDecision] = useState<"Aprobado" | "Rechazado">("Aprobado");

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border p-3 text-sm"
      style={{ borderColor: "var(--border-hairline)" }}
    >
      <input type="hidden" name="id" value={documento.id} />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="estado"
            value="Aprobado"
            checked={decision === "Aprobado"}
            onChange={() => setDecision("Aprobado")}
          />
          Aprobar
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="estado"
            value="Rechazado"
            checked={decision === "Rechazado"}
            onChange={() => setDecision("Rechazado")}
          />
          Pedir correcciones
        </label>
      </div>
      <textarea
        name="comentario"
        placeholder={
          decision === "Rechazado"
            ? "Explica qué debe corregir el emprendedor"
            : "Comentario opcional"
        }
        rows={2}
        className="rounded-md border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {isPending ? "Guardando..." : "Guardar revisión"}
        </button>
        {state.error && <p style={{ color: "var(--status-critical)" }}>{state.error}</p>}
      </div>
    </form>
  );
}

export function DocumentosEtapa({
  emprendedorId,
  etapaActual,
  documentos,
  puedeSubir,
  puedeRevisar,
}: {
  emprendedorId: string;
  etapaActual: Etapa;
  documentos: Documento[];
  puedeSubir: boolean;
  puedeRevisar: boolean;
}) {
  const tieneAprobadoEtapaActual = documentos.some(
    (d) => d.etapa === etapaActual && d.estado === "Aprobado"
  );

  return (
    <Card
      title="Documentos de soporte"
      subtitle={`Evidencia que sustenta el avance por la cadena de valor — etapa actual: ${etapaActual}`}
    >
      <div className="flex flex-col gap-4">
        {!tieneAprobadoEtapaActual && (
          <p
            className="rounded-md border p-3 text-sm"
            style={{ borderColor: "var(--status-warning)", color: "var(--text-secondary)" }}
          >
            Todavía no hay un documento aprobado para &quot;{etapaActual}&quot; — se necesita al
            menos uno para poder avanzar a la siguiente etapa.
          </p>
        )}

        {puedeSubir && <SubirDocumentoForm emprendedorId={emprendedorId} />}

        {documentos.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Todavía no se han subido documentos.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {documentos.map((d) => (
              <li
                key={d.id}
                className="rounded-md border p-3 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <a
                      href={`/api/documentos/${d.id}/archivo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      {d.nombreArchivo}
                    </a>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Etapa {d.etapa} · {formatBytes(d.tamanoBytes)} · subido por {d.subidoPor} el{" "}
                      {d.createdAt}
                    </p>
                  </div>
                  <EstadoDocumentoBadge estado={d.estado} />
                </div>
                {d.comentarioRevision && (
                  <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Observaciones de {d.revisadoPor ?? "revisión"}: {d.comentarioRevision}
                  </p>
                )}
                {puedeRevisar && d.estado === "Pendiente" && (
                  <RevisarDocumentoRow documento={d} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
