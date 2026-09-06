import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import {
  downloadHeaders,
  getExportAccount,
  recordExportAudit,
  sanitizeFilename,
} from "@/lib/reports/auth";
import {
  createClientArchiveStream,
  prepareClientArchive,
} from "@/lib/reports/client-archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await getExportAccount();
  if (!account)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const requestedClientId = new URL(request.url).searchParams.get("clientId");
  const clientId = account.role === "client" ? account.id : requestedClientId;
  if (
    !clientId ||
    !isUuid(clientId) ||
    (account.role !== "client" && account.role !== "admin") ||
    (account.role === "client" &&
      requestedClientId &&
      requestedClientId !== account.id)
  ) {
    return NextResponse.json(
      { error: "No tienes permiso para esta exportación." },
      { status: 403 },
    );
  }

  try {
    const prepared = await prepareClientArchive(clientId);
    if (!prepared)
      return NextResponse.json(
        { error: "Cliente no encontrado." },
        { status: 404 },
      );
    await recordExportAudit(account, {
      clientId,
      exportType: "client_archive",
      result: "completed",
      approximateSizeBytes: prepared.approximateSizeBytes,
    });
    const stream = createClientArchiveStream(prepared.entries);
    const filename =
      sanitizeFilename(`datos-cardonafit-${prepared.displayName}`) ||
      "datos-cardonafit";
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: downloadHeaders(`${filename}.zip`, "application/zip"),
    });
  } catch (error) {
    await recordExportAudit(account, {
      clientId,
      exportType: "client_archive",
      result: "failed",
    });
    console.error("No se pudo generar la exportación de datos", error);
    const message =
      error instanceof Error
        ? error.message
        : "No fue posible generar la exportación.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("100 MB") ? 413 : 500 },
    );
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
