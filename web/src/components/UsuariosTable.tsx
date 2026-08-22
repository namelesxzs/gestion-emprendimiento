import type { UsuarioGestionable } from "@/lib/types";
import { UsuarioRow } from "./UsuarioRow";

export function UsuariosTable({
  rows,
  usuarioActualId,
  onEditar,
}: {
  rows: UsuarioGestionable[];
  usuarioActualId?: string;
  onEditar: (usuario: UsuarioGestionable) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Todavía no hay usuarios registrados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-hairline)" }}>
      <table className="w-full overflow-x-auto text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-2)" }}>
            {["Nombre", "Correo", "Rol", "Sede", "Estado", "Acciones"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-xs font-bold tracking-wide uppercase"
                style={{ color: "var(--brand-ink)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
            <UsuarioRow
              key={u.id}
              usuario={u}
              primera={i === 0}
              esUnoMismo={u.id === usuarioActualId}
              onEditar={() => onEditar(u)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
