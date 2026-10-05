import payload from "@/data/opencc-variants.json";

const lookup = payload.lookup as Record<string, string[]>;

function unique(values: string[]) {
  return [...new Set(values)];
}

export function variantOptions(char: string) {
  return lookup[char] ?? [];
}

export function variantSlots(simplified: string, traditional: string) {
  const simp = Array.from(simplified);
  const trad = Array.from(traditional);
  return trad.map((char, index) => {
    const fromSimplified = simp[index] ? lookup[simp[index]] : undefined;
    const options = unique([char, ...(lookup[char] ?? []), ...(fromSimplified ?? [])]);
    return options.length > 1 ? options : [];
  });
}

export function replaceChar(text: string, index: number, next: string) {
  const chars = Array.from(text);
  if (index < 0 || index >= chars.length) return text;
  chars[index] = next;
  return chars.join("");
}
