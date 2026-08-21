"use client";

interface FilterChipProps {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}

export function FilterChip({ label, active, color, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={{
        borderColor: active ? "var(--brand-primary)" : "var(--border-hairline)",
        backgroundColor: active ? "var(--brand-primary-tint)" : "transparent",
        color: active ? "var(--brand-primary)" : "var(--text-muted)",
      }}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </button>
  );
}
