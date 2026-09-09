// Per-process memory protection; deployment-wide quotas belong at the gateway.
const active = new Set<string>();
export function acquireExportCapacity(accountId: string) {
  if (active.size >= 2 || active.has(accountId)) return null;
  active.add(accountId);
  let released = false;
  return () => {
    if (!released) {
      released = true;
      active.delete(accountId);
    }
  };
}
