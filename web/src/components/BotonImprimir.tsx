"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      Imprimir / guardar PDF
    </button>
  );
}
