import type { SheetBoxSize } from "@/lib/stroke-pdf";

export type WordBand = {
  chars: string[];
  models: string[];
  traces: string[];
  practice: number;
};

const MIN_PRACTICE = 6;
const hanPattern = /\p{Script=Han}/u;
const punctPattern = /\p{P}/u;

export type CopyCell =
  | { kind: "char"; char: string }
  | { kind: "space" };

export function copyLines(text: string, limit: number): CopyCell[][] {
  const lines: CopyCell[][] = [];
  let count = 0;
  const normalized = text.replace(/\r\n?/g, "\n");
  for (const raw of normalized.split("\n")) {
    const line: CopyCell[] = [];
    let reached = false;
    for (const char of Array.from(raw)) {
      if (hanPattern.test(char) || punctPattern.test(char)) {
        if (count >= limit) {
          reached = true;
          break;
        }
        line.push({ kind: "char", char });
        count += 1;
      } else if (/[ \t\u3000\u00a0]/.test(char)) {
        line.push({ kind: "space" });
      }
    }
    lines.push(line);
    if (reached || count >= limit) break;
  }
  return lines;
}

export function copyColumns(boxSize: SheetBoxSize) {
  return boxSize === "large" ? 6 : 10;
}

export function withCopyGrid(lines: CopyCell[][], columns: number): CopyCell[][] {
  const width = Math.max(1, columns);
  const blank = (): CopyCell => ({ kind: "space" });
  const pad = (row: CopyCell[]) =>
    row.length >= width ? row : [...row, ...Array.from({ length: width - row.length }, blank)];
  const rows: CopyCell[][] = [];
  for (const line of lines) {
    if (line.length === 0) {
      rows.push(pad([]));
      continue;
    }
    for (let start = 0; start < line.length; start += width) {
      rows.push(pad(line.slice(start, start + width)));
    }
  }
  return rows;
}

export function copyChars(lines: CopyCell[][]) {
  return lines.flatMap((line) => line.flatMap((cell) => (cell.kind === "char" ? [cell.char] : [])));
}

export function pickedCopyLines(lines: CopyCell[][], picks: boolean[]) {
  let index = 0;
  const picked: CopyCell[][] = [];
  for (const line of lines) {
    const kept: CopyCell[] = [];
    for (const cell of line) {
      if (cell.kind === "space") {
        kept.push(cell);
        continue;
      }
      if (picks[index]) kept.push(cell);
      index += 1;
    }
    picked.push(kept);
  }
  return picked;
}

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
