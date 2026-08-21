"use client";

import { useMemo, useState } from "react";
import type { Reunion } from "@/lib/types";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADO_COLOR: Record<string, string> = {
  Programada: "var(--status-good)",
  Reagendada: "var(--status-warning)",
  Cancelada: "var(--status-critical)",
  Realizada: "var(--text-muted)",
};

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // lunes = 0

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarioMensual({
  reuniones,
  selectedDate,
  onSelectDate,
}: {
  reuniones: Reunion[];
  selectedDate: string | null;
  onSelectDate: (fecha: string | null) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const hoy = new Date();
    return { year: hoy.getFullYear(), month: hoy.getMonth() };
  });

  const cells = useMemo(() => getMonthGrid(cursor.year, cursor.month), [cursor]);

  const reunionesPorDia = useMemo(() => {
    const map = new Map<string, Reunion[]>();
    for (const r of reuniones) {
      if (!map.has(r.fecha)) map.set(r.fecha, []);
      map.get(r.fecha)!.push(r);
    }
    return map;
  }, [reuniones]);

  function fechaDeCelda(dia: number) {
    const mm = String(cursor.month + 1).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    return `${cursor.year}-${mm}-${dd}`;
  }

  function cambiarMes(delta: number) {
    setCursor((c) => {
      const nuevo = new Date(c.year, c.month + delta, 1);
      return { year: nuevo.getFullYear(), month: nuevo.getMonth() };
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          className="rounded-md px-2 py-1 text-sm font-bold"
          style={{ color: "var(--brand-primary)" }}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <p className="text-sm font-bold" style={{ color: "var(--brand-ink)" }}>
          {MESES[cursor.month]} {cursor.year}
        </p>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          className="rounded-md px-2 py-1 text-sm font-bold"
          style={{ color: "var(--brand-primary)" }}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {d}
          </div>
        ))}

        {cells.map((dia, i) => {
          if (dia === null) return <div key={i} />;

          const fecha = fechaDeCelda(dia);
          const items = reunionesPorDia.get(fecha) ?? [];
          const active = fecha === selectedDate;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(active ? null : fecha)}
              className="flex flex-col items-center gap-1 rounded-md border py-1.5 transition-colors"
              style={{
                borderColor: active ? "var(--brand-primary)" : "var(--border-hairline)",
                backgroundColor: active ? "var(--brand-primary-tint)" : "var(--surface-1)",
              }}
            >
              <span
                className="text-xs tabular-nums"
                style={{ color: active ? "var(--brand-primary)" : "var(--text-secondary)" }}
              >
                {dia}
              </span>
              {items.length > 0 && (
                <div className="flex gap-0.5">
                  {items.slice(0, 4).map((r) => (
                    <span
                      key={r.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: ESTADO_COLOR[r.estado] ?? "var(--text-muted)" }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(ESTADO_COLOR).map(([estado, color]) => (
          <span key={estado} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {estado}
          </span>
        ))}
      </div>
    </div>
  );
}
