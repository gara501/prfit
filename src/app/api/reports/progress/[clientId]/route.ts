import { NextResponse } from "next/server";
import {
  downloadHeaders,
  getExportAccount,
  recordExportAudit,
  sanitizeFilename,
} from "@/lib/reports/auth";
import { getProgressReportData } from "@/lib/reports/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const account = await getExportAccount();
  if (!account)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { clientId } = await params;
  const validation = parseOptions(clientId, await request.formData());
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  try {
    const data = await getProgressReportData(account, validation);
    if (!data)
      return NextResponse.json(
        { error: "Cliente no encontrado." },
        { status: 404 },
      );

    const { renderProgressPdf } = await import("@/lib/reports/documents");
    const pdf = await renderProgressPdf(data);
    await recordExportAudit(account, {
      clientId,
      exportType: "progress_pdf",
      periodStart: data.from,
      periodEnd: data.to,
      anonymized: data.anonymized,
      result: "completed",
      approximateSizeBytes: pdf.byteLength,
    });
    const subject = data.anonymized
      ? "anonimo"
      : sanitizeFilename(data.clientName);
    return new Response(new Uint8Array(pdf), {
      headers: downloadHeaders(
        `progreso-${subject || "cliente"}-${data.from}-${data.to}.pdf`,
        "application/pdf",
      ),
    });
  } catch (error) {
    await recordExportAudit(account, {
      clientId,
      exportType: "progress_pdf",
      periodStart: validation.from,
      periodEnd: validation.to,
      anonymized: validation.anonymized,
      result: "failed",
    });
    console.error("No se pudo generar el reporte de progreso", error);
    return NextResponse.json(
      { error: "No fue posible generar el reporte." },
      { status: 500 },
    );
  }
}

function parseOptions(clientId: string, params: FormData) {
  const from = stringValue(params.get("from"));
  const to = stringValue(params.get("to"));
  if (!isUuid(clientId) || !isDate(from) || !isDate(to) || from > to) {
    return { error: "El cliente o el rango de fechas no es válido." } as const;
  }
  const fromDate = new Date(`${from}T00:00:00Z`);
  const maximumEnd = new Date(fromDate);
  maximumEnd.setUTCMonth(maximumEnd.getUTCMonth() + 24);
  if (new Date(`${to}T00:00:00Z`) > maximumEnd) {
    return { error: "El rango máximo permitido es de 24 meses." } as const;
  }
  const anonymized = stringValue(params.get("mode")) !== "complete";
  const authorizationConfirmed =
    stringValue(params.get("authorization")) === "confirmed";
  if (!anonymized && !authorizationConfirmed) {
    return {
      error:
        "Confirma la autorización del cliente para el reporte identificable.",
    } as const;
  }
  const trainerNotes = stringValue(params.get("notes")).trim();
  if (trainerNotes.length > 1500) {
    return {
      error: "Las observaciones no pueden superar 1500 caracteres.",
    } as const;
  }
  const exerciseIds = params.getAll("exercise").map(stringValue).filter(isUuid);
  if (exerciseIds.length > 8) {
    return { error: "Selecciona máximo 8 ejercicios destacados." } as const;
  }
  return {
    clientId,
    from,
    to,
    anonymized,
    authorizationConfirmed,
    includeMeasurements: stringValue(params.get("measurements")) === "include",
    trainerNotes,
    exerciseIds,
  };
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function isDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
