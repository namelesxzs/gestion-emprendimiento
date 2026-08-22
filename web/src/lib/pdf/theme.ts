// Paleta institucional replicada en valores literales — react-pdf no lee
// variables CSS (globals.css), así que estos deben mantenerse en sync a mano
// con :root en src/app/globals.css si la identidad visual cambia.
export const PDF_COLORS = {
  ink: "#003366",
  primary: "#0689bb",
  textPrimary: "#1a1a1a",
  textSecondary: "#4a4a4a",
  textMuted: "#767676",
  border: "#dcdcdc",
  surfaceAlt: "#f2f6f8",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
  etapa: {
    Descubrir: "#2a78d6",
    Incubar: "#eb6834",
    Formar: "#1baf7a",
    Fomentar: "#eda100",
    Financiar: "#e87ba4",
  } as Record<string, string>,
};
