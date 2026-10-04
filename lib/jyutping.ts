export type JyutpingToken = {
  text: string;
  readings: string[];
};

export async function annotate(text: string): Promise<JyutpingToken[]> {
  if (!text) return [];
  const { getJyutpingCandidates } = await import("to-jyutping");
  return getJyutpingCandidates(text).map(([token, readings]) => ({
    text: token,
    readings,
  }));
}

export async function jyutpingLine(text: string) {
  if (!text) return "";
  const { getJyutpingText } = await import("to-jyutping");
  return getJyutpingText(text);
}
