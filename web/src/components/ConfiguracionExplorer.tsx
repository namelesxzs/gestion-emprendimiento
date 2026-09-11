"use client";

import { useState } from "react";
import type { EtapaRow, FaseRow, InstrumentoRow, ReglaAvanceRow } from "@/lib/queries";
import { FasesTab } from "./configuracion/FasesTab";
import { EtapasTab } from "./configuracion/EtapasTab";
import { InstrumentosTab } from "./configuracion/InstrumentosTab";
import { ReglasAvanceTab } from "./configuracion/ReglasAvanceTab";

const TABS = ["Fases", "Etapas", "Instrumentos", "Reglas de avance"] as const;
type Tab = (typeof TABS)[number];

/** El catálogo configurable en sí (ver auditoría §07/§08, C1) — a
 * diferencia de /ruta (las fases activas como pestañas, para todos los
 * roles), esta pantalla es donde el Administrador activa, desactiva y
 * ajusta lo que /ruta y los formularios de captura terminan mostrando. */
export function ConfiguracionExplorer({
  fases,
  etapas,
  instrumentos,
  reglas,
}: {
  fases: FaseRow[];
  etapas: EtapaRow[];
  instrumentos: InstrumentoRow[];
  reglas: ReglaAvanceRow[];
}) {
  const [tab, setTab] = useState<Tab>("Fases");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border-hairline)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="border-b-2 px-4 py-2.5 text-sm font-bold tracking-wide uppercase transition-colors"
            style={{
              borderColor: tab === t ? "var(--brand-primary)" : "transparent",
              color: tab === t ? "var(--brand-primary)" : "var(--text-secondary)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Fases" && <FasesTab fases={fases} />}
      {tab === "Etapas" && <EtapasTab etapas={etapas} fases={fases} />}
      {tab === "Instrumentos" && <InstrumentosTab instrumentos={instrumentos} fases={fases} />}
      {tab === "Reglas de avance" && <ReglasAvanceTab reglas={reglas} fases={fases} instrumentos={instrumentos} />}
    </div>
  );
}
