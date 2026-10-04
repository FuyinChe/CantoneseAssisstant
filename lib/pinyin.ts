import type { JyutpingToken } from "./jyutping";

const pinyinPattern = /[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜńňǹ]/i;

export async function annotatePinyin(text: string): Promise<JyutpingToken[]> {
  if (!text) return [];
  const { pinyin, polyphonic } = await import("pinyin-pro");
  const primary = pinyin(text, { type: "array", toneType: "symbol" }) as string[];
  const groups = polyphonic(text, { toneType: "symbol", type: "array" }) as string[][];
  return Array.from(text).map((char, index) => {
    const seen = new Set<string>();
    const readings: string[] = [];
    for (const item of [primary[index], ...(groups[index] ?? [])]) {
      if (!item || !pinyinPattern.test(item) || item === char || seen.has(item)) continue;
      seen.add(item);
      readings.push(item);
    }
    return { text: char, readings };
  });
}
