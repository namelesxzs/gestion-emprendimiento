import type { Acompanamiento } from "@/lib/types";
import { ETAPA_COLOR_VAR } from "./etapa-colors";
import { EtapaBadge } from "./EtapaBadge";
import { EstadoCompromisoBadge } from "./EstadoCompromisoBadge";
import { AvanceMeter } from "./AvanceMeter";

export function AcompanamientoCard({ acompanamiento }: { acompanamiento: Acompanamiento }) {
  return (
    <article
      className="rounded-lg border p-4"
      style={{
        backgroundColor: "var(--surface-1)",
        borderColor: "var(--border-hairline)",
        borderLeftWidth: "3px",
        borderLeftColor: ETAPA_COLOR_VAR[acompanamiento.etapa],
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        <EtapaBadge etapa={acompanamiento.etapa} />
        <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {acompanamiento.fecha}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Diagnóstico
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-primary)" }}>
            {acompanamiento.diagnostico}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Recomendaciones
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {acompanamiento.recomendaciones}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Compromisos
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {acompanamiento.compromisos}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Estado del compromiso
          </p>
          <div className="mt-1">
            <EstadoCompromisoBadge estado={acompanamiento.estado} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Avance
        </p>
        <div className="mt-1">
          <AvanceMeter pct={acompanamiento.avancePct} />
        </div>
      </div>
    </article>
  );
}
