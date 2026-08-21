"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/emprendedores", label: "Emprendedores" },
  { href: "/acompanamientos", label: "Acompañamientos" },
];

export function NavBar() {
  const pathname = usePathname();

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
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}
          >
            UIE <span style={{ color: "var(--brand-primary)" }}>· María Cano</span>
          </span>
          <div className="flex gap-6">
            {LINKS.map((link) => {
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
          </div>
        </div>
      </div>
    </nav>
  );
}
