import type { PhraseEntry } from "./types";

type IndexedEntry = PhraseEntry & { length: number };

export function createMatcher(entries: PhraseEntry[]) {
  const grouped = new Map<string, IndexedEntry[]>();

  for (const entry of entries) {
    const from = entry.from.trim();
    const to = entry.to;
    if (!from || !to) continue;
    const key = from[0];
    const list = grouped.get(key) ?? [];
    list.push({ from, to, length: from.length });
    grouped.set(key, list);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => b.length - a.length);
  }

  return {
    apply(text: string) {
      let output = "";
      for (let index = 0; index < text.length; ) {
        const candidates = grouped.get(text[index]);
        const match = candidates?.find((entry) => text.startsWith(entry.from, index));
        if (match) {
          output += match.to;
          index += match.length;
        } else {
          output += text[index];
          index += 1;
        }
      }
      return output;
    },
  };
}
