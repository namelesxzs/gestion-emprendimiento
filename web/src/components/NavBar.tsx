"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/emprendedores", label: "Emprendedores" },
  { href: "/acompanamientos", label: "Acompañamientos" },
  { href: "/reuniones", label: "Reuniones" },
];

// El Emprendedor no tiene una vista de "todos los emprendedores" (RF13) —
// esa página redirige al Dashboard, así que ni se le muestra el enlace.
const LINKS_EMPRENDEDOR = [
  { href: "/", label: "Mi progreso" },
  { href: "/acompanamientos", label: "Mi historial" },
  { href: "/reuniones", label: "Mis reuniones" },
];

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DOCENTE: "Docente",
  COORDINADOR: "Coordinador",
  EMPRENDEDOR: "Emprendedor",
};

export function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoginPage = pathname === "/login";
  const puedeImportar = session?.user.rol === "ADMINISTRADOR" || session?.user.rol === "DOCENTE";
  const links = session?.user.rol === "EMPRENDEDOR" ? LINKS_EMPRENDEDOR : LINKS;

  return (
    <nav>
      {/* Franja superior institucional */}
      <div style={{ backgroundColor: "var(--brand-header)" }}>
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-1.5">
          <span className="text-xs tracking-wide" style={{ color: "#aaaaaa" }}>
            Fundación Universitaria María Cano
          </span>
          <span className="text-xs tracking-wide" style={{ color: "#aaaaaa" }}>
            Unidad de Innovación y Emprendimiento
          </span>
        </div>
      </div>

      {/* Barra principal */}
      <div
        style={{
          backgroundColor: "var(--surface-1)",
          boxShadow: "var(--shadow-header)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className={`mx-auto flex w-full max-w-5xl items-center px-6 py-5 ${
            isLoginPage ? "justify-center" : "justify-between"
          }`}
        >
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}
          >
            UIE <span style={{ color: "var(--brand-primary)" }}>· María Cano</span>
          </span>

          {/* En /login no hay sesión ni nada que navegar todavía: no mostrar
              enlaces ni datos de usuario, para que la barra sea coherente
              con el estado real (no autenticado). */}
          {!isLoginPage && (
            <div className="flex items-center gap-6">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`border-b-2 pb-1 text-sm font-bold tracking-wide uppercase transition-colors ${
                      active
                        ? "[color:var(--brand-primary)] [border-color:var(--brand-primary)]"
                        : "border-transparent [color:var(--text-primary)] hover:[color:var(--brand-primary)] hover:[border-color:var(--brand-primary)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {puedeImportar && (
                <Link
                  href="/importar"
                  className={`border-b-2 pb-1 text-sm font-bold tracking-wide uppercase transition-colors ${
                    pathname === "/importar"
                      ? "[color:var(--brand-primary)] [border-color:var(--brand-primary)]"
                      : "border-transparent [color:var(--text-primary)] hover:[color:var(--brand-primary)] hover:[border-color:var(--brand-primary)]"
                  }`}
                >
                  Importar Excel
                </Link>
              )}

              {status === "authenticated" && session?.user && (
                <div className="flex items-center gap-3 border-l pl-6" style={{ borderColor: "var(--border-hairline)" }}>
                  <div className="text-right leading-tight">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {session.user.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {ROL_LABEL[session.user.rol] ?? session.user.rol}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
