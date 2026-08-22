import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS } from "./theme";
import type { Acompanamiento, Compromiso, Emprendedor, Reunion } from "@/lib/types";
import type { EmprendedoresPorSede } from "@/lib/queries";
import {
  getCumplimientoCompromisos,
  getDistribucionSector,
  getEfectividadReuniones,
  getIngresosPorMes,
} from "@/lib/kpis";
import { getEtapaDistribution, getKpis } from "@/lib/view";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: PDF_COLORS.textPrimary },
  eyebrow: { fontSize: 8, color: PDF_COLORS.primary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, color: PDF_COLORS.ink, fontWeight: 700, marginTop: 2 },
  subtitle: { fontSize: 9, color: PDF_COLORS.textSecondary, marginTop: 2, marginBottom: 16 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statTile: {
    width: "31%",
    borderTopWidth: 3,
    borderTopColor: PDF_COLORS.primary,
    borderStyle: "solid",
    backgroundColor: PDF_COLORS.surfaceAlt,
    padding: 8,
  },
  statValue: { fontSize: 16, fontWeight: 700, color: PDF_COLORS.ink },
  statLabel: { fontSize: 7, color: PDF_COLORS.textSecondary, textTransform: "uppercase", marginTop: 2 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: PDF_COLORS.ink,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    borderStyle: "solid",
    paddingBottom: 3,
  },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
  barLabel: { width: 110, fontSize: 8, color: PDF_COLORS.textSecondary },
  barTrack: { flex: 1, height: 8, backgroundColor: PDF_COLORS.surfaceAlt },
  barFill: { height: 8 },
  barCount: { width: 24, fontSize: 8, textAlign: "right", color: PDF_COLORS.textSecondary },
  row2col: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 7, color: PDF_COLORS.textMuted },
});

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = Math.max(4, Math.round((count / max) * 100));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export function IndicadoresPdf({
  emprendedores,
  acompanamientos,
  reuniones,
  compromisos,
  emprendedoresPorSede,
  generadoPor,
}: {
  emprendedores: Emprendedor[];
  acompanamientos: Acompanamiento[];
  reuniones: Reunion[];
  compromisos: Compromiso[];
  emprendedoresPorSede: EmprendedoresPorSede[];
  generadoPor: string;
}) {
  const kpis = getKpis(emprendedores, acompanamientos);
  const distribucionEtapa = getEtapaDistribution(emprendedores);
  const distribucionSector = getDistribucionSector(emprendedores);
  const ingresosPorMes = getIngresosPorMes(emprendedores);
  const cumplimiento = getCumplimientoCompromisos(compromisos);
  const efectividad = getEfectividadReuniones(reuniones);

  const maxEtapa = Math.max(1, ...distribucionEtapa.map((d) => d.count));
  const maxSector = Math.max(1, ...distribucionSector.map((d) => d.count));
  const maxSede = Math.max(1, ...emprendedoresPorSede.map((d) => d.total));
  const maxReunion = Math.max(1, ...efectividad.porEstado.map((d) => d.count));
  const maxIngreso = Math.max(1, ...ingresosPorMes.map((d) => d.count));

  const generadoEl = new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });

  return (
    <Document title="Indicadores institucionales UIE">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Unidad de Innovación y Emprendimiento — FUMC</Text>
        <Text style={styles.title}>Indicadores institucionales</Text>
        <Text style={styles.subtitle}>Generado el {generadoEl} por {generadoPor}</Text>

        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{kpis.totalEmprendedores}</Text>
            <Text style={styles.statLabel}>Total emprendedores</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{kpis.activos}</Text>
            <Text style={styles.statLabel}>Emprendedores activos</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{kpis.totalAcompanamientos}</Text>
            <Text style={styles.statLabel}>Acompañamientos</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{kpis.avancePromedio}%</Text>
            <Text style={styles.statLabel}>Avance promedio</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{cumplimiento.pctCumplimiento}%</Text>
            <Text style={styles.statLabel}>Cumplimiento compromisos</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{efectividad.pctEfectividad}%</Text>
            <Text style={styles.statLabel}>Efectividad reuniones</Text>
          </View>
        </View>

        <View style={styles.row2col}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Emprendedores por etapa</Text>
            {distribucionEtapa.map((d) => (
              <BarRow key={d.etapa} label={d.etapa} count={d.count} max={maxEtapa} color={PDF_COLORS.etapa[d.etapa]} />
            ))}

            <Text style={styles.sectionTitle}>Emprendedores por sede</Text>
            {emprendedoresPorSede.map((d) => (
              <BarRow key={d.sede} label={d.sede} count={d.total} max={maxSede} color={PDF_COLORS.primary} />
            ))}
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Distribución por sector</Text>
            {distribucionSector.slice(0, 8).map((d) => (
              <BarRow key={d.sector} label={d.sector} count={d.count} max={maxSector} color={PDF_COLORS.warning} />
            ))}

            <Text style={styles.sectionTitle}>Reuniones por estado</Text>
            {efectividad.porEstado.map((d) => (
              <BarRow key={d.estado} label={d.estado} count={d.count} max={maxReunion} color={PDF_COLORS.good} />
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingresos por mes</Text>
        {ingresosPorMes.map((d) => (
          <BarRow key={d.mes} label={d.mes} count={d.count} max={maxIngreso} color={PDF_COLORS.ink} />
        ))}

        <Text style={styles.sectionTitle}>Cumplimiento de compromisos</Text>
        <Text style={{ fontSize: 9, color: PDF_COLORS.textSecondary }}>
          {cumplimiento.cumplidos} de {cumplimiento.total} compromisos cumplidos ({cumplimiento.pctCumplimiento}%).{" "}
          {cumplimiento.vencidos} vencido{cumplimiento.vencidos === 1 ? "" : "s"} sin cumplir.
        </Text>

        <Text style={styles.footer} fixed>
          Plataforma UIE · Fundación Universitaria María Cano — reporte generado automáticamente, sujeto a los datos
          registrados a la fecha de generación.
        </Text>
      </Page>
    </Document>
  );
}
