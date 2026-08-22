import path from "node:path";
import type { NextConfig } from "next";

// Cabeceras de seguridad básicas (Fase 10). No incluye Content-Security-Policy
// a propósito: definir una CSP correcta para las páginas + hidratación de
// Next requiere probar cada ruta con cuidado, y no se alcanzó a hacer esa
// verificación en esta fase — ver docs/SEGURIDAD.md.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
