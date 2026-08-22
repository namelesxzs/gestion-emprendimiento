"use client";

import { useState } from "react";
import type { Docente } from "@/lib/types";
import { Card } from "./Card";
import { DocentesTable } from "./DocentesTable";
import { NuevoDocenteForm } from "./NuevoDocenteForm";

export function UsuariosExplorer({ docentes }: { docentes: Docente[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {showForm ? "Cerrar formulario" : "+ Nuevo docente"}
        </button>
      </div>

      {showForm && <NuevoDocenteForm onDone={() => setShowForm(false)} />}

      <Card
        title="Docentes"
        subtitle={`${docentes.length} docente${docentes.length === 1 ? "" : "s"} registrado${docentes.length === 1 ? "" : "s"}`}
      >
        <DocentesTable rows={docentes} />
      </Card>
    </div>
  );
}
