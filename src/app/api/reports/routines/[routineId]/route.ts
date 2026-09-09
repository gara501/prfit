import { NextResponse } from "next/server";
import {
  downloadHeaders,
  getExportAccount,
  recordExportAudit,
  sanitizeFilename,
} from "@/lib/reports/auth";
import { getRoutineReportData } from "@/lib/reports/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ routineId: string }> },
) {
  const account = await getExportAccount();
  if (!account)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { routineId } = await params;
  if (!isUuid(routineId)) {
    return NextResponse.json({ error: "Rutina inválida." }, { status: 400 });
  }
  let reportClientId: string | null = null;
  try {
    const data = await getRoutineReportData(account, routineId);
    if (!data)
      return NextResponse.json(
        { error: "Rutina no encontrada." },
        { status: 404 },
      );

    reportClientId = data.clientId;
    const { renderRoutinePdf } = await import("@/lib/reports/documents");
    const pdf = await renderRoutinePdf(data);
    await recordExportAudit(account, {
      clientId: data.clientId,
      exportType: "routine_pdf",
      routineId: data.id,
      result: "completed",
      approximateSizeBytes: pdf.byteLength,
    });
    const base =
      sanitizeFilename(`${data.name}-v${data.versionNumber}`) || "rutina";
    return new Response(new Uint8Array(pdf), {
      headers: downloadHeaders(`${base}.pdf`, "application/pdf"),
    });
  } catch (error) {
    if (reportClientId)
      await recordExportAudit(account, {
        clientId: reportClientId,
        exportType: "routine_pdf",
        routineId,
        result: "failed",
      });
    console.error("No se pudo generar el PDF de rutina", error);
    return NextResponse.json(
      { error: "No fue posible generar el PDF." },
      { status: 500 },
    );
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
