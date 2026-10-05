export const TIANZI_VIEW = 72;

export type TianziMark = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function dashedMarks(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  dash: number,
  gap: number,
): TianziMark[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length === 0) return [];
  const ux = dx / length;
  const uy = dy / length;
  const vertical = Math.abs(dx) < Math.abs(dy);
  const marks: TianziMark[] = [];
  let offset = 0;
  while (offset < length - 0.4) {
    const start = offset;
    const end = Math.min(offset + dash, length);
    const sx = x1 + ux * start;
    const sy = y1 + uy * start;
    const ex = x1 + ux * end;
    const ey = y1 + uy * end;
    if (vertical) {
      marks.push({
        x: sx - thickness / 2,
        y: Math.min(sy, ey),
        w: thickness,
        h: Math.max(0.6, Math.abs(ey - sy)),
      });
    } else {
      marks.push({
        x: Math.min(sx, ex),
        y: sy - thickness / 2,
        w: Math.max(0.6, Math.abs(ex - sx)),
        h: thickness,
      });
    }
    offset += dash + gap;
  }
  return marks;
}

export function glyphTransform(size: number) {
  const padX = size * 0.08;
  const padTop = size * 0.06;
  const padBottom = size * 0.14;
  const scale = Math.min((size - padX * 2) / 1024, (size - padTop - padBottom) / 1024);
  const x = (size - 1024 * scale) / 2;
  const y = size - padBottom;
  return `translate(${x} ${y}) scale(${scale} ${-scale})`;
}

export const TIANZI_INK = "#d2c8bb";

export function tianziMarks(size: number, thickness = 1): TianziMark[] {
  const inset = 1.6;
  const mid = size / 2;
  const dash = Math.max(3.8, size * 0.055);
  const gap = Math.max(2.6, size * 0.038);
  return [
    ...dashedMarks(mid, inset, mid, size - inset, thickness, dash, gap),
    ...dashedMarks(inset, mid, size - inset, mid, thickness, dash, gap),
  ];
}

export function tianziSvgMarks(size: number, fill = TIANZI_INK) {
  return tianziMarks(size)
    .map((mark) => `<rect x="${mark.x.toFixed(2)}" y="${mark.y.toFixed(2)}" width="${mark.w.toFixed(2)}" height="${mark.h.toFixed(2)}" fill="${fill}"/>`)
    .join("");
}
