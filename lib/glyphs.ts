/** Marks characters that are not the same in every version at that position. */
export function glyphMarks(texts: string[]) {
  const rows = texts.map((text) => Array.from(text));
  return rows.map((row) =>
    row.map((_, index) => new Set(rows.map((item) => item[index] ?? "")).size > 1),
  );
}
