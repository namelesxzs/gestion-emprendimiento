import { ETAPA_COLOR_VAR } from "./etapa-colors";
import type { Etapa } from "@/lib/types";

interface EtapaBarChartProps {
  data: { etapa: Etapa; count: number }[];
}

export function EtapaBarChart({ data }: EtapaBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-3">
      {data.map(({ etapa, count }) => {
        const pct = Math.round((count / max) * 100);
        const color = ETAPA_COLOR_VAR[etapa];

        return (
          <div
            key={etapa}
            className="group relative grid grid-cols-[92px_1fr_28px] items-center gap-3"
          >
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {etapa}
            </span>

            <div
              className="h-5 overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--surface-2)" }}
            >
              <div
                className="h-5 rounded-full transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            <span
              className="text-right text-sm tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              {count}
            </span>

            <div
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-[92px] z-10 whitespace-nowrap rounded-md border px-2 py-1 text-xs opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              style={{
                backgroundColor: "var(--surface-1)",
                borderColor: "var(--border-hairline)",
                color: "var(--text-primary)",
              }}
            >
              {etapa}: {count} emprendedor{count === 1 ? "" : "es"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
