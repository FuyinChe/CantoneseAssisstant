/** Black pinyin printed above each character, as on some textbook pages. */

export type SizedBox = {
  text: string;
  width: number;
  height: number;
};

function hanCount(text: string) {
  return (text.match(/\p{Script=Han}/gu) ?? []).length;
}

/**
 * True when many character boxes are much taller than the short ones and still
 * narrow. That is pinyin and the glyph sharing one detection, not a normal line.
 */
export function isPinyinAbovePage(boxes: SizedBox[]) {
  const han = boxes.filter((box) => hanCount(box.text) >= 1 && box.height >= 12 && box.width >= 8);
  if (han.length < 12) return false;
  const heights = han.map((box) => box.height).sort((a, b) => a - b);
  const charH = heights[Math.floor(heights.length * 0.25)] ?? 0;
  if (charH < 16) return false;
  const capped = han.filter(
    (box) => box.height > charH * 1.45 && box.height < charH * 3.3 && box.width < charH * 2.3,
  );
  return capped.length >= 8 && capped.length / han.length >= 0.18;
}
