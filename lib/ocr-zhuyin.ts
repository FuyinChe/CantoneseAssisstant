/** Taiwan zhuyin sits in a narrow column just to the right of each character. */

export type InkRun = { start: number; end: number };

export function zhuyinClearRanges(ink: number[], height: number): Array<[number, number]> {
  const threshold = Math.max(2, height * 0.08);
  const runs: InkRun[] = [];
  let start = -1;
  for (let x = 0; x <= ink.length; x++) {
    const on = x < ink.length && ink[x] >= threshold && ink[x] < height * 0.9;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      runs.push({ start, end: x });
      start = -1;
    }
  }
  if (runs.length < 4) return [];

  const closeGap = Math.max(6, height * 0.055);
  const closed: InkRun[] = [];
  for (const run of runs) {
    const prev = closed[closed.length - 1];
    if (prev && run.start - prev.end <= closeGap) prev.end = run.end;
    else closed.push({ start: run.start, end: run.end });
  }

  const widths = closed.map((run) => run.end - run.start);
  // Narrow zhuyin runs outnumber the characters, so the middle width is the ruby.
  // Character width is the middle of the wider half.
  const substantial = widths.filter((width) => width >= height * 0.12).sort((a, b) => a - b);
  if (substantial.length < 4) return [];
  const pivot = substantial[Math.floor(substantial.length / 2)] ?? 0;
  const upper = substantial.filter((width) => width >= pivot);
  const charWidth = upper[Math.floor(upper.length / 2)] ?? 0;
  if (upper.filter((width) => width >= charWidth * 0.72).length < 3) return [];
  const splitGap = Math.max(closeGap + 2, charWidth * 0.42);

  const cells: InkRun[][] = [];
  let cell: InkRun[] = [closed[0]];
  for (let i = 1; i < closed.length; i++) {
    const gap = closed[i].start - closed[i - 1].end;
    if (gap >= splitGap) {
      cells.push(cell);
      cell = [closed[i]];
    } else cell.push(closed[i]);
  }
  cells.push(cell);

  const clear: Array<[number, number]> = [];
  let erased = 0;
  for (const group of cells) {
    const widest = group.reduce((best, run) => (run.end - run.start > best.end - best.start ? run : best));
    const wide = widest.end - widest.start;
    if (wide < charWidth * 0.55) continue;
    const ruby = group.filter((run) => run.start >= widest.end && run.end - run.start <= wide * 0.5);
    if (!ruby.length) continue;
    erased += 1;
    for (const run of ruby) clear.push([run.start, run.end]);
  }
  if (erased < 3 || erased / cells.length < 0.4) return [];
  return clear;
}

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };

function boxOf(poly: Array<[number, number]>): Box {
  const xs = poly.map((point) => point[0]);
  const ys = poly.map((point) => point[1]);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function columnInk(data: Uint8ClampedArray, width: number, x0: number, x1: number, y0: number, y1: number) {
  const ink = new Array<number>(Math.max(0, x1 - x0)).fill(0);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      const lum = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      if (lum < 150) ink[x - x0] += 1;
    }
  }
  return ink;
}

function bandsInColumn(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  x1: number,
  charHeight: number,
) {
  const rows: number[] = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = x0; x < x1; x += 2) {
      const index = (y * width + x) * 4;
      const lum = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      if (lum < 150) count += 1;
    }
    rows.push(count);
  }
  const found: Array<[number, number]> = [];
  let start = -1;
  const minInk = Math.max(4, (x1 - x0) * 0.012);
  for (let y = 0; y <= height; y++) {
    const on = y < height && rows[y] >= minInk;
    if (on && start < 0) start = y;
    if (!on && start >= 0) {
      const bandHeight = y - start;
      if (bandHeight >= charHeight * 0.45 && bandHeight <= charHeight * 1.8) found.push([start, y]);
      start = -1;
    }
  }
  return found;
}

function whiten(data: Uint8ClampedArray, width: number, x0: number, x1: number, y0: number, y1: number) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
  }
}

export type TextBand = { left: number; right: number; top: number; bottom: number };

/**
 * When the first pass sees wide text lines, wipe the narrow columns on their right.
 * Returns the rows that were cleaned so the page can be read again.
 */
export function eraseZhuyinColumns(
  canvas: HTMLCanvasElement,
  polys: Array<Array<[number, number]>>,
): TextBand[] {
  const boxes = polys
    .map(boxOf)
    .filter((box) => box.width > box.height * 4 && box.height >= 24 && box.width >= 80);
  if (boxes.length < 2) return [];

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const charHeight = boxes.map((box) => box.height).sort((a, b) => a - b)[Math.floor(boxes.length / 2)] ?? 40;

  const columns: Box[][] = [];
  const sorted = [...boxes].sort((a, b) => a.left - b.left);
  for (const box of sorted) {
    const column = columns.find((group) => {
      const left = Math.min(...group.map((item) => item.left));
      const right = Math.max(...group.map((item) => item.right));
      const overlap = Math.min(right, box.right) - Math.max(left, box.left);
      return overlap > Math.min(box.width, right - left) * 0.4;
    });
    if (column) column.push(box);
    else columns.push([box]);
  }

  let wiped = 0;
  const cleaned: TextBand[] = [];
  for (const column of columns) {
    const x0 = Math.max(0, Math.floor(Math.min(...column.map((box) => box.left)) - charHeight * 0.2));
    const x1 = Math.min(canvas.width, Math.ceil(Math.max(...column.map((box) => box.right)) + 4));
    const bands = bandsInColumn(image.data, canvas.width, canvas.height, x0, x1, charHeight);
    for (const [top, bottom] of bands) {
      const ink = columnInk(image.data, canvas.width, x0, x1, top, bottom);
      const ranges = zhuyinClearRanges(ink, bottom - top);
      if (!ranges.length) continue;
      for (const [start, end] of ranges) {
        whiten(image.data, canvas.width, x0 + start, x0 + end, top, bottom);
        wiped += 1;
      }
      cleaned.push({ left: x0, right: x1, top, bottom });
    }
  }
  if (wiped < 6) return [];
  context.putImageData(image, 0, 0);
  return cleaned;
}
