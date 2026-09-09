export function createSaveQueue() {
  const tails = new Map<string, Promise<unknown>>();
  return async function enqueue<T>(
    key: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(task);
    tails.set(key, result);
    try {
      return await result;
    } finally {
      if (tails.get(key) === result) tails.delete(key);
    }
  };
}
