export function isOwnMedicalDocumentPath(
  path: string,
  clientId: string,
  screeningId: string,
) {
  const parts = path.split("/");
  return (
    parts.length === 3 &&
    parts[0] === clientId &&
    parts[1] === screeningId &&
    /^[0-9a-f-]{36}\.(pdf|png|jpg)$/i.test(parts[2])
  );
}
