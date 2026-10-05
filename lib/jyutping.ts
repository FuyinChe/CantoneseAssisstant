export type JyutpingToken = {
  text: string;
  readings: string[];
};

export async function annotate(text: string): Promise<JyutpingToken[]> {
  if (!text) return [];
  const { getJyutpingCandidates } = await import("to-jyutping");
  const tokens: JyutpingToken[] = [];
  for (const part of text.split(/(\n)/)) {
    if (part === "\n") {
      tokens.push({ text: "\n", readings: [] });
      continue;
    }
    if (!part) continue;
    for (const [token, readings] of getJyutpingCandidates(part)) {
      tokens.push({ text: token, readings });
    }
  }
  return tokens;
}

export async function jyutpingLine(text: string) {
  if (!text) return "";
  const { getJyutpingText } = await import("to-jyutping");
  return getJyutpingText(text);
}
