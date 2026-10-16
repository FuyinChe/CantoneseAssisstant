const readable = /\p{L}|\p{N}/u;

export function speechSentences(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  const parts = normalized
    .split(/\n+|(?<=[。！？!?；;])|(?<=(?<!\d)\.)(?=\s|$)/u)
    .map((part) => part.trim())
    .filter((part) => readable.test(part));
  return parts.length > 0 ? parts : [normalized];
}

export const SPEECH_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function clampSpeechRate(rate: number) {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(2, Math.max(0.5, rate));
}
