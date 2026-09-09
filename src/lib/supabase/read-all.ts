type Result<T> = { data: T[] | null; error: { message: string } | null };
type PagedQuery<T> = {
  range(from: number, to: number): PromiseLike<Result<T>>;
};

// Callers must supply a deterministic, unique order. Continue until an empty
// page: a deployment may impose a smaller row cap than the requested page size.
export async function readAll<T>(query: PagedQuery<T>) {
  const data: T[] = [];
  for (;;) {
    const page = await query.range(data.length, data.length + 499);
    if (page.error) throw new Error("No fue posible cargar todos los datos.");
    if (!page.data) throw new Error("La consulta no devolvió datos.");
    if (page.data.length === 0) return { data, error: null };
    data.push(...page.data);
  }
}

export async function requireQuery<T>(
  query: PromiseLike<{ data: T; error: { message: string } | null }>,
) {
  const result = await query;
  if (result.error)
    throw new Error("No fue posible cargar los datos solicitados.");
  return result;
}

export async function readByIds<T>(
  ids: readonly string[],
  build: (ids: string[]) => PagedQuery<T>,
) {
  const data: T[] = [];
  const unique = [...new Set(ids)];
  for (let offset = 0; offset < unique.length; offset += 100) {
    data.push(
      ...(await readAll(build(unique.slice(offset, offset + 100)))).data,
    );
  }
  return { data, error: null };
}
