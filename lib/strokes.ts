export type StrokeData = {
  strokes: string[];
};

const cache = new Map<string, StrokeData | null>();

export async function loadStrokes(char: string): Promise<StrokeData | null> {
  const cached = cache.get(char);
  if (cached !== undefined) return cached;

  const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      cache.set(char, null);
      return null;
    }
    const data = (await response.json()) as { strokes?: unknown };
    const strokes = Array.isArray(data.strokes)
      ? data.strokes.filter((stroke): stroke is string => typeof stroke === "string" && stroke.length > 0)
      : [];
    const result = strokes.length > 0 ? { strokes } : null;
    cache.set(char, result);
    return result;
  } catch {
    cache.set(char, null);
    return null;
  }
}
