import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS } from "./theme";
import type { Acompanamiento, Emprendedor, Reunion } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: PDF_COLORS.textPrimary },
  eyebrow: { fontSize: 8, color: PDF_COLORS.primary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, color: PDF_COLORS.ink, fontWeight: 700, marginTop: 2 },
  subtitle: { fontSize: 10, color: PDF_COLORS.textSecondary, marginTop: 2, marginBottom: 14 },
  datosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  datoBox: { width: "31%" },
  datoLabel: { fontSize: 7, color: PDF_COLORS.textMuted, textTransform: "uppercase" },
  datoValue: { fontSize: 9, color: PDF_COLORS.textPrimary, marginTop: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    borderStyle: "solid",
    paddingBottom: 3,
  },
  card: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderStyle: "solid",
    borderLeftWidth: 3,
    padding: 8,
    marginBottom: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardEtapa: { fontSize: 8, fontWeight: 700, color: PDF_COLORS.ink },
  cardFecha: { fontSize: 8, color: PDF_COLORS.textMuted },
  cardLabel: { fontSize: 7, color: PDF_COLORS.textMuted, textTransform: "uppercase", marginTop: 3 },
  cardText: { fontSize: 9, color: PDF_COLORS.textSecondary, marginTop: 1 },
  empty: { fontSize: 9, color: PDF_COLORS.textMuted, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 7, color: PDF_COLORS.textMuted },
});

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.datoBox}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValue}>{value}</Text>
    </View>
  );
}

export function FichaEmprendedorPdf({
  emprendedor,
  acompanamientos,
  reuniones,
}: {
  emprendedor: Emprendedor;
  acompanamientos: Acompanamiento[];
  reuniones: Reunion[];
}) {
  const generadoEl = new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
  const color = PDF_COLORS.etapa[emprendedor.etapa] ?? PDF_COLORS.primary;

  return (
    <Document title={`Ficha — ${emprendedor.nombre}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Unidad de Innovación y Emprendimiento — FUMC</Text>
        <Text style={styles.title}>{emprendedor.nombre}</Text>
        <Text style={styles.subtitle}>
          {emprendedor.emprendimiento} · {emprendedor.sector} — generado el {generadoEl}
        </Text>

        <View style={styles.datosGrid}>
          <Dato label="Etapa" value={emprendedor.etapa} />
          <Dato label="Estado" value={emprendedor.estado} />
          <Dato label="Responsable" value={emprendedor.responsable} />
          <Dato label="Correo" value={emprendedor.correo} />
          <Dato label="Teléfono" value={emprendedor.telefono} />
          <Dato label="Fecha de ingreso" value={emprendedor.fechaIngreso} />
        </View>

        <Text style={styles.sectionTitle}>Historial de acompañamientos ({acompanamientos.length})</Text>
        {acompanamientos.length === 0 ? (
          <Text style={styles.empty}>Sin acompañamientos registrados.</Text>
        ) : (
          acompanamientos.map((a) => (
            <View key={a.id} style={[styles.card, { borderLeftColor: PDF_COLORS.etapa[a.etapa] ?? color }]} wrap={false}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEtapa}>{a.etapa}</Text>
                <Text style={styles.cardFecha}>{a.fecha} · avance {a.avancePct}%</Text>
              </View>
              <Text style={styles.cardLabel}>Diagnóstico</Text>
              <Text style={styles.cardText}>{a.diagnostico}</Text>
              <Text style={styles.cardLabel}>Recomendaciones</Text>
              <Text style={styles.cardText}>{a.recomendaciones}</Text>
              <Text style={styles.cardLabel}>Compromisos ({a.estado})</Text>
              <Text style={styles.cardText}>{a.compromisos}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Historial de reuniones ({reuniones.length})</Text>
        {reuniones.length === 0 ? (
          <Text style={styles.empty}>Sin reuniones registradas.</Text>
        ) : (
          reuniones.map((r) => (
            <View key={r.id} style={styles.card} wrap={false}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEtapa}>{r.estado}</Text>
                <Text style={styles.cardFecha}>{r.fecha} · {r.hora}</Text>
              </View>
              <Text style={styles.cardLabel}>Acción — {r.accion}</Text>
              <Text style={styles.cardText}>{r.observaciones}</Text>
            </View>
          ))
        )}

        <Text style={styles.footer} fixed>
          Plataforma UIE · Fundación Universitaria María Cano — documento generado automáticamente a partir del
          registro de acompañamiento.
        </Text>
      </Page>
    </Document>
  );
}
