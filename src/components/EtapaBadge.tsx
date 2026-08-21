import type { Etapa } from "@/lib/types";
import { ETAPA_COLOR_VAR } from "./etapa-colors";

export function EtapaBadge({ etapa }: { etapa: Etapa }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      style={{ color: "var(--text-secondary)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: ETAPA_COLOR_VAR[etapa] }}
      />
      {etapa}
    </span>
  );
}
