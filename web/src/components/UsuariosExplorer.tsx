"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { UsuarioGestionable } from "@/lib/types";
import { Card } from "./Card";
import { UsuariosTable } from "./UsuariosTable";
import { NuevoUsuarioForm } from "./NuevoUsuarioForm";
import { EditarUsuarioForm } from "./EditarUsuarioForm";

export function UsuariosExplorer({ usuarios }: { usuarios: UsuarioGestionable[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<UsuarioGestionable | null>(null);
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setShowForm((v) => !v);
          }}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {showForm ? "Cerrar formulario" : "+ Nuevo usuario"}
        </button>
      </div>

      {showForm && <NuevoUsuarioForm onDone={() => setShowForm(false)} />}

      {editando && <EditarUsuarioForm usuario={editando} onDone={() => setEditando(null)} />}

      <Card
        title="Usuarios"
        subtitle={`${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"} registrado${usuarios.length === 1 ? "" : "s"}`}
      >
        <UsuariosTable
          rows={usuarios}
          usuarioActualId={session?.user.id}
          onEditar={(u) => {
            setShowForm(false);
            setEditando(u);
          }}
        />
      </Card>
    </div>
  );
}
