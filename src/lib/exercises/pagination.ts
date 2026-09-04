export const EXERCISES_PAGE_SIZE = 12;

export function parseExercisePage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function buildExercisesHref(page: number, query = "") {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) params.set("q", normalizedQuery);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/trainer/exercises?${search}` : "/trainer/exercises";
}
