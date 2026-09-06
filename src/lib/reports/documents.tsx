import "server-only";

import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";
import type {
  ProgressPoint,
  ProgressReportData,
  RoutineReportData,
  RoutineReportSet,
} from "./types";

const colors = {
  ink: "#172033",
  muted: "#64748B",
  border: "#D7DAD4",
  surface: "#F5F6F2",
  orange: "#E86F24",
  green: "#287A55",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingBottom: 48,
    paddingHorizontal: 34,
    paddingTop: 32,
  },
  brand: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.6,
  },
  title: { fontSize: 25, fontWeight: 700, marginBottom: 7, marginTop: 10 },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 1.45,
    maxWidth: 480,
  },
  metaGrid: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    marginTop: 18,
  },
  meta: { flexGrow: 1, paddingBottom: 9, paddingRight: 8, paddingTop: 9 },
  metaLabel: {
    color: colors.muted,
    fontSize: 6.5,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaValue: { fontSize: 9, fontWeight: 700 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 9,
    marginTop: 9,
  },
  day: {
    backgroundColor: colors.ink,
    color: colors.white,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  exercise: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 6,
    paddingTop: 5,
  },
  exerciseName: { fontSize: 10.5, fontWeight: 700, marginBottom: 5 },
  note: {
    color: colors.muted,
    fontSize: 7.5,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  tableHeader: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    paddingVertical: 3,
  },
  row: { flexDirection: "row", minHeight: 16, paddingVertical: 3 },
  cSet: { paddingHorizontal: 4, width: "8%" },
  cReps: { paddingHorizontal: 4, width: "16%" },
  cWeight: { paddingHorizontal: 4, width: "14%" },
  cEffort: { paddingHorizontal: 4, width: "13%" },
  cRest: { paddingHorizontal: 4, width: "12%" },
  cTempo: { paddingHorizontal: 4, width: "12%" },
  cMethod: { paddingHorizontal: 4, width: "25%" },
  tableLabel: {
    color: colors.muted,
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  footer: {
    bottom: 20,
    color: colors.muted,
    flexDirection: "row",
    fontSize: 7,
    justifyContent: "space-between",
    left: 34,
    position: "absolute",
    right: 34,
  },
  statRow: { flexDirection: "row", gap: 7, marginBottom: 16, marginTop: 16 },
  stat: { backgroundColor: colors.surface, flexGrow: 1, padding: 10 },
  statValue: { fontSize: 16, fontWeight: 700 },
  statLabel: {
    color: colors.muted,
    fontSize: 6.5,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  chart: {
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  chartTitle: { fontSize: 9, fontWeight: 700, marginBottom: 8 },
  bars: { alignItems: "flex-end", flexDirection: "row", gap: 3, height: 62 },
  bar: { backgroundColor: colors.orange, minWidth: 7 },
  chartCaption: { color: colors.muted, fontSize: 6.5, marginTop: 6 },
  metricRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 7,
  },
  disclaimer: {
    backgroundColor: colors.surface,
    color: colors.muted,
    fontSize: 7.5,
    lineHeight: 1.45,
    marginTop: 16,
    padding: 10,
  },
});

export async function renderRoutinePdf(data: RoutineReportData) {
  return renderToBuffer(<RoutineDocument data={data} />);
}

export async function renderProgressPdf(data: ProgressReportData) {
  return renderToBuffer(<ProgressDocument data={data} />);
}

function RoutineDocument({ data }: { data: RoutineReportData }) {
  const days = [
    ...new Set(data.exercises.map((exercise) => exercise.dayNumber)),
  ].sort();
  return (
    <Document
      author="CardonaFit"
      subject="Plan de entrenamiento"
      title={data.name}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>CARDONAFIT · PLAN DE ENTRENAMIENTO</Text>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.subtitle}>
          {data.description || "Plan de entrenamiento individualizado."}
        </Text>
        <View style={styles.metaGrid}>
          <Meta label="CLIENTE" value={data.clientName} />
          <Meta label="TRAINER" value={data.trainerName} />
          <Meta label="VERSIÓN" value={`v${data.versionNumber}`} />
          <Meta
            label="VIGENCIA"
            value={`${shortDate(data.startDate)} — ${data.endDate ? shortDate(data.endDate) : "abierta"}`}
          />
        </View>
        <View style={styles.metaGrid}>
          <Meta label="DÍAS / SEMANA" value={String(data.daysAtWeek ?? "—")} />
          <Meta label="INTENSIDAD" value={`${data.intensityLevel}/5`} />
          <Meta label="MÉTRICA" value={data.effortMetric.toUpperCase()} />
          <Meta label="ESTADO" value={statusLabel(data.status)} />
        </View>
        {data.goal ? (
          <View>
            <Text style={styles.sectionTitle}>Objetivo del ciclo</Text>
            <Text style={styles.subtitle}>{data.goal}</Text>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>Programación semanal</Text>
        <Text style={styles.subtitle}>
          {days.length} jornadas · {data.exercises.length} ejercicios. Cada día
          comienza en una página independiente para facilitar la impresión y el
          uso durante el entrenamiento.
        </Text>
        <PdfFooter />
      </Page>
      {days.map((day) => (
        <Page key={day} size="A4" style={styles.page}>
          <Text style={styles.brand}>
            {data.name.toUpperCase()} · DÍA {day}
          </Text>
          <Text style={styles.day}>DÍA {day}</Text>
          {data.exercises
            .filter((exercise) => exercise.dayNumber === day)
            .map((exercise, index) => (
              <View
                key={`${day}-${exercise.orderIndex}`}
                style={styles.exercise}
                wrap={false}
              >
                <Text style={styles.exerciseName}>
                  {index + 1}. {exercise.name}
                </Text>
                {exercise.techniqueNotes ? (
                  <Text style={styles.note}>
                    Indicaciones: {exercise.techniqueNotes}
                  </Text>
                ) : null}
                {exercise.clientNotes ? (
                  <Text style={styles.note}>
                    Nota individual: {exercise.clientNotes}
                  </Text>
                ) : null}
                <SetTable
                  effortMetric={data.effortMetric}
                  sets={exercise.sets}
                />
              </View>
            ))}
          <PdfFooter />
        </Page>
      ))}
    </Document>
  );
}

function ProgressDocument({ data }: { data: ProgressReportData }) {
  const healthLabels: Record<ProgressReportData["healthStatus"], string> = {
    not_submitted: "No incluido / sin evaluación",
    current: "Evaluación preventiva vigente",
    expired: "Evaluación pendiente de actualización",
    requires_clearance: "Requiere autorización médica",
  };
  return (
    <Document
      author="CardonaFit"
      subject="Reporte de progreso"
      title="Reporte de progreso CardonaFit"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>CARDONAFIT · REPORTE DE PROGRESO</Text>
        <Text style={styles.title}>
          {data.anonymized ? "Evolución de entrenamiento" : data.clientName}
        </Text>
        <Text style={styles.subtitle}>
          Periodo analizado: {longDate(data.from)} a {longDate(data.to)}.
        </Text>
        <View style={styles.statRow}>
          <Stat
            label="SESIONES COMPLETADAS"
            value={String(data.completedSessions)}
          />
          <Stat
            label="ADHERENCIA"
            value={
              data.adherencePercent === null
                ? "Sin agenda"
                : `${data.adherencePercent}%`
            }
          />
          <Stat label="SERIES" value={String(data.completedSets)} />
          <Stat label="VOLUMEN" value={`${formatNumber(data.volumeKg)} kg`} />
        </View>
        <View style={styles.metaGrid}>
          <Meta
            label="SESIONES PLANIFICADAS"
            value={String(data.plannedSessions)}
          />
          <Meta label="REPETICIONES" value={formatNumber(data.totalReps)} />
          <Meta
            label="TIEMPO ENTRENADO"
            value={formatDuration(data.totalDurationSeconds)}
          />
          <Meta label="SALUD" value={healthLabels[data.healthStatus]} />
        </View>
        <Text style={styles.sectionTitle}>Ejercicios destacados</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableLabel, { width: "34%" }]}>EJERCICIO</Text>
          <Text style={[styles.tableLabel, { width: "14%" }]}>SESIONES</Text>
          <Text style={[styles.tableLabel, { width: "16%" }]}>SERIES</Text>
          <Text style={[styles.tableLabel, { width: "18%" }]}>MEJOR CARGA</Text>
          <Text style={[styles.tableLabel, { width: "18%" }]}>1RM EST.</Text>
        </View>
        {data.exercises.length ? (
          data.exercises.map((exercise) => (
            <View key={exercise.exerciseId} style={styles.metricRow}>
              <Text style={{ width: "34%" }}>{exercise.name}</Text>
              <Text style={{ width: "14%" }}>{exercise.sessions}</Text>
              <Text style={{ width: "16%" }}>{exercise.completedSets}</Text>
              <Text style={{ width: "18%" }}>
                {exercise.bestWeightKg === null
                  ? "—"
                  : `${formatNumber(exercise.bestWeightKg)} kg`}
              </Text>
              <Text style={{ width: "18%" }}>
                {exercise.bestEstimatedOneRepMaxKg === null
                  ? "—"
                  : `${formatNumber(exercise.bestEstimatedOneRepMaxKg)} kg`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.note}>
            No hay series completadas en el periodo seleccionado.
          </Text>
        )}
        {data.weightProgress.length > 0 || data.fatProgress.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Composición corporal</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {data.weightProgress.length ? (
                <MiniChart label="Peso (kg)" points={data.weightProgress} />
              ) : null}
              {data.fatProgress.length ? (
                <MiniChart
                  label="Grasa corporal (%)"
                  points={data.fatProgress}
                />
              ) : null}
            </View>
          </View>
        ) : null}
        {data.trainerNotes ? (
          <View>
            <Text style={styles.sectionTitle}>Observaciones del trainer</Text>
            <Text style={styles.subtitle}>{data.trainerNotes}</Text>
          </View>
        ) : null}
        <Text style={styles.disclaimer}>
          Este reporte resume registros de entrenamiento y no constituye
          diagnóstico, historia clínica ni recomendación médica. La estimación
          de 1RM es orientativa. CardonaFit no reemplaza la valoración de un
          profesional de salud.
        </Text>
        <PdfFooter />
      </Page>
    </Document>
  );
}

function SetTable({
  sets,
  effortMetric,
}: {
  sets: RoutineReportSet[];
  effortMetric: string;
}) {
  return (
    <View>
      <View style={styles.tableHeader}>
        <Cell header style={styles.cSet}>
          #
        </Cell>
        <Cell header style={styles.cReps}>
          REPS
        </Cell>
        <Cell header style={styles.cWeight}>
          CARGA
        </Cell>
        <Cell header style={styles.cEffort}>
          {effortMetric.toUpperCase()}
        </Cell>
        <Cell header style={styles.cRest}>
          PAUSA
        </Cell>
        <Cell header style={styles.cTempo}>
          TEMPO
        </Cell>
        <Cell header style={styles.cMethod}>
          MÉTODO
        </Cell>
      </View>
      {sets.map((set) => (
        <View key={set.setNumber} style={styles.row}>
          <Cell style={styles.cSet}>{set.setNumber}</Cell>
          <Cell style={styles.cReps}>{repsLabel(set)}</Cell>
          <Cell style={styles.cWeight}>
            {set.weight === null ? "—" : `${set.weight} kg`}
          </Cell>
          <Cell style={styles.cEffort}>
            {effortMetric === "rpe"
              ? (set.targetRpe ?? "—")
              : (set.targetRir ?? "—")}
          </Cell>
          <Cell style={styles.cRest}>
            {set.restSeconds === null ? "—" : `${set.restSeconds}s`}
          </Cell>
          <Cell style={styles.cTempo}>{set.tempo || "—"}</Cell>
          <Cell style={styles.cMethod}>
            {methodLabel(set.trainingMethod)}
            {set.optional ? " · opcional" : ""}
          </Cell>
        </View>
      ))}
    </View>
  );
}

function Cell({
  children,
  header,
  style,
}: {
  children: ReactNode;
  header?: boolean;
  style: Style;
}) {
  return (
    <Text style={[header ? styles.tableLabel : {}, style]}>{children}</Text>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniChart({
  label,
  points,
}: {
  label: string;
  points: ProgressPoint[];
}) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return (
    <View style={[styles.chart, { flexGrow: 1, width: "49%" }]}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.bars}>
        {points.slice(-16).map((point) => (
          <View
            key={`${point.date}-${point.value}`}
            style={[
              styles.bar,
              { flexGrow: 1, height: 12 + ((point.value - min) / range) * 48 },
            ]}
          />
        ))}
      </View>
      <Text style={styles.chartCaption}>
        {shortDate(points[0].date)} · {formatNumber(points[0].value)} →{" "}
        {shortDate(points.at(-1)?.date ?? points[0].date)} ·{" "}
        {formatNumber(points.at(-1)?.value ?? points[0].value)}
      </Text>
    </View>
  );
}

function PdfFooter() {
  return (
    <View fixed style={styles.footer}>
      <Text>
        Generado por CardonaFit ·{" "}
        {new Intl.DateTimeFormat("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/Bogota",
        }).format(new Date())}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

function repsLabel(set: RoutineReportSet) {
  if (set.reps !== null) return String(set.reps);
  if (set.repsMin !== null && set.repsMax !== null)
    return `${set.repsMin}–${set.repsMax}`;
  return "—";
}

function methodLabel(value: string) {
  return value === "straight" ? "Convencional" : value.replaceAll("_", " ");
}

function statusLabel(value: string) {
  return value === "published"
    ? "Publicada"
    : value === "draft"
      ? "Borrador"
      : "Archivada";
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}
