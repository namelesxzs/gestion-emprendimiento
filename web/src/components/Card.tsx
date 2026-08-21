export function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--surface-1)",
        borderColor: "var(--border-hairline)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className="text-sm font-bold tracking-wide uppercase"
            style={{ color: "var(--brand-ink)", fontFamily: "var(--font-brand)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
