export function toCsv(
  rows: readonly Record<string, unknown>[],
  preferredHeaders: readonly string[] = [],
) {
  const discovered = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) discovered.add(key);
  }
  const headers = [
    ...preferredHeaders.filter((header) => discovered.has(header)),
    ...[...discovered].filter((header) => !preferredHeaders.includes(header)),
  ];
  if (headers.length === 0) return "";
  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(","),
    ),
  ].join("\r\n");
}

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const normalized =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  const formulaSafe = /^[=+\-@]/.test(normalized)
    ? `'${normalized}`
    : normalized;
  return /[",\r\n]/.test(formulaSafe)
    ? `"${formulaSafe.replaceAll('"', '""')}"`
    : formulaSafe;
}
