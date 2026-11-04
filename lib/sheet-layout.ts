import type { SheetBoxSize } from "@/lib/stroke-pdf";

export type WordBand = {
  chars: string[];
  models: string[];
  traces: string[];
  practice: number;
};

const MIN_PRACTICE = 6;
const hanPattern = /\p{Script=Han}/u;

export function sheetGroups(text: string, limit: number) {
  const groups: string[][] = [];
  let count = 0;
  const push = (chars: string[]) => {
    const room = limit - count;
    if (room <= 0 || chars.length === 0) return;
    const taken = chars.slice(0, room);
    groups.push(taken);
    count += taken.length;
  };
  if (/[,，]/.test(text)) {
    for (const part of text.split(/[,，]+/)) {
      push(Array.from(part).filter((char) => hanPattern.test(char)));
      if (count >= limit) break;
    }
    return groups;
  }
  const chars = Array.from(text).filter((char) => hanPattern.test(char));
  for (let index = 0; index < chars.length && count < limit; index += 2) {
    push(chars.slice(index, index + 2));
  }
  return groups;
}

export function pickedGroups(groups: string[][], picks: boolean[]) {
  let index = 0;
  const picked: string[][] = [];
  for (const group of groups) {
    const kept: string[] = [];
    for (const char of group) {
      if (picks[index]) kept.push(char);
      index += 1;
    }
    if (kept.length > 0) picked.push(kept);
  }
  return picked;
}

export function wordBands(groups: string[][], boxSize: SheetBoxSize): WordBand[] {
  const perRow = boxSize === "large" ? 6 : 10;
  return groups.map((group) => {
    const lead = group.length * 2;
    return {
      chars: group,
      models: group,
      traces: group,
      practice: Math.max(MIN_PRACTICE, perRow - lead),
    };
  });
}
