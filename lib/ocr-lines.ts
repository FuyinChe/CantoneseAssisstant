/** Turn PaddleOCR boxes into reading-order lines. */

export type OcrBox = {
  text: string;
  score: number;
  poly: Array<[number, number]>;
};

type Row = {
  text: string;
  x: number;
  y: number;
  left: number;
  width: number;
  height: number;
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Glyph height is the short side of the quad, so a tilted line does not look huge. */
function measurePoly(poly: Array<[number, number]>) {
  const edges: number[] = [];
  let x = 0;
  let y = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [px, py] = poly[i];
    const [nx, ny] = poly[(i + 1) % poly.length];
    edges.push(Math.hypot(nx - px, ny - py));
    x += px;
    y += py;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const n = Math.max(poly.length, 1);
  const aabbH = Math.max(8, maxY - minY);
  const longEdge = edges.reduce((max, edge) => Math.max(max, edge), 0);
  const shortEdge = edges.reduce((min, edge) => {
    if (edge >= 8 && edge <= longEdge * 0.9) return Math.min(min, edge);
    return min;
  }, Infinity);
  const height = Math.max(8, Math.min(aabbH, shortEdge === Infinity ? aabbH : shortEdge));
  // Baseline, not the box center. Pinyin above a character pulls the center up
  // and splits one printed line into two.
  return { x: x / n, y: maxY, left: minX, width: Math.max(8, maxX - minX), height };
}

function hanCount(text: string) {
  return (text.match(/\p{Script=Han}/gu) ?? []).length;
}

function latinCount(text: string) {
  return (text.match(/\p{Script=Latin}/gu) ?? []).length;
}

/** Pinyin ruby sits in its own short box, or is almost only Latin. */
function isRubyBox(text: string, height: number, hanHeight: number) {
  const han = hanCount(text);
  const latin = latinCount(text);
  if (han === 0 && latin >= 2) return true;
  if (latin >= 4 && latin > han) return true;
  if (han === 0 && hanHeight > 0 && height < hanHeight * 0.62) return true;
  return false;
}

function joinParts(parts: Row[]) {
  return parts
    .sort((a, b) => a.left - b.left)
    .map((part) => part.text)
    .join("");
}

function xOverlapRatio(a: Row, b: Row) {
  const overlap = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  if (overlap <= 0) return 0;
  return overlap / Math.min(a.width, b.width);
}

/** How far apart two stacked character rows are. */
function stackedSpacing(rows: Row[], unit: number) {
  const gaps: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (xOverlapRatio(rows[i], rows[j]) < 0.4) continue;
      const dy = Math.abs(rows[i].y - rows[j].y);
      if (dy > unit * 0.9) gaps.push(dy);
    }
  }
  if (!gaps.length) return { spacing: unit * 1.7, known: false };
  gaps.sort((a, b) => a - b);
  return { spacing: gaps[Math.floor(gaps.length * 0.2)] ?? gaps[0], known: true };
}

/** Group by baseline. The anchor does not walk down the page. */
function clusterByBaseline(rows: Row[], limit: number) {
  const sorted = [...rows].sort((a, b) => a.y - b.y || a.left - b.left);
  const lines: Array<{ anchor: number; parts: Row[] }> = [];
  for (const row of sorted) {
    let best = -1;
    let bestDy = Infinity;
    for (let i = 0; i < lines.length; i++) {
      const dy = Math.abs(row.y - lines[i].anchor);
      if (dy < bestDy) {
        bestDy = dy;
        best = i;
      }
    }
    if (best >= 0 && bestDy <= limit) lines[best].parts.push(row);
    else lines.push({ anchor: row.y, parts: [row] });
  }
  return lines.sort((a, b) => a.anchor - b.anchor).map((line) => line.parts);
}

function isScrap(parts: Row[]) {
  return parts.length === 1 && hanCount(parts[0].text) <= 2;
}

/**
 * A short box at the right edge sits above its line; a short box at the left edge
 * sits below its line. Attach each scrap in that direction only.
 */
function absorbScraps(lines: Row[][], spacing: number, unit: number) {
  const cores: Row[][] = [];
  const scraps: Row[][] = [];
  for (const line of lines) {
    if (isScrap(line)) scraps.push(line);
    else cores.push(line);
  }
  if (!cores.length) return lines;
  for (const scrap of scraps) {
    const piece = scrap[0];
    const pieceRight = piece.left + piece.width;
    let best = -1;
    let bestDy = Infinity;
    for (let i = 0; i < cores.length; i++) {
      const core = cores[i];
      const coreY = median(core.map((part) => part.y));
      const coreLeft = Math.min(...core.map((part) => part.left));
      const coreRight = Math.max(...core.map((part) => part.left + part.width));
      const onRight = piece.left >= coreRight - unit * 0.35;
      const onLeft = pieceRight <= coreLeft + unit * 0.35;
      const dy = Math.abs(coreY - piece.y);
      const tail = onRight && coreY >= piece.y && dy <= spacing * 0.65;
      const head = onLeft && coreY <= piece.y && dy <= spacing * 0.8;
      if ((tail || head) && dy < bestDy) {
        bestDy = dy;
        best = i;
      }
    }
    if (best >= 0) cores[best].push(piece);
    else cores.push(scrap);
  }
  return cores.sort((a, b) => median(a.map((part) => part.y)) - median(b.map((part) => part.y)));
}

/** Sort detected text boxes into horizontal lines, left to right. */
export function linesFromBoxes(items: OcrBox[], minScore = 0.35) {
  const measured = items
    .filter((item) => item.text.trim() && item.score >= minScore && item.poly.length > 0)
    .map((item) => ({ text: item.text.trim(), ...measurePoly(item.poly) }))
    .sort((a, b) => a.y - b.y || a.left - b.left);

  const hanHeights = measured.filter((row) => hanCount(row.text) >= 1).map((row) => row.height);
  const hanHeight = median(hanHeights);
  const rows = measured.filter((row) => !isRubyBox(row.text, row.height, hanHeight));
  if (!rows.length) return "";
  const unit = median(rows.map((row) => row.height)) || hanHeight || 32;
  const { spacing, known } = stackedSpacing(rows, unit);
  const limit = known ? Math.max(10, spacing * 0.34) : Math.max(10, unit * 0.72);

  return joinRaisedRights(
    absorbScraps(peelRaisedLefts(clusterByBaseline(rows, limit), unit), spacing, unit),
    spacing,
    unit,
  )
    .map(joinParts)
    .join("\n");
}

/**
 * A short box glued to the left of the next line sits above that line's body.
 * The real left edge of a tilted line sits below the rest, so it stays.
 */
function peelRaisedLefts(lines: Row[][], unit: number) {
  const step = Math.max(8, unit * 0.2);
  const out: Row[][] = [];
  for (const line of lines) {
    const sorted = [...line].sort((a, b) => a.left - b.left);
    const bodyIndex = sorted.findIndex((part) => hanCount(part.text) >= 3 || part.width >= unit * 2.2);
    if (bodyIndex <= 0) {
      out.push(line);
      continue;
    }
    const body = sorted.slice(bodyIndex);
    const bodyY = median(body.map((part) => part.y));
    const bodyLeft = Math.min(...body.map((part) => part.left));
    const prefix: Row[] = [];
    for (let i = 0; i < bodyIndex; i++) {
      const part = sorted[i];
      if (hanCount(part.text) > 2) break;
      if (part.left + part.width > bodyLeft + unit * 0.35) break;
      if (bodyY - part.y < step) break;
      prefix.push(part);
    }
    if (!prefix.length) {
      out.push(line);
      continue;
    }
    for (const part of prefix) out.push([part]);
    out.push(sorted.filter((part) => !prefix.includes(part)));
  }
  return out.sort((a, b) => median(a.map((part) => part.y)) - median(b.map((part) => part.y)));
}

/**
 * On a rotated page the right half of a line sits above the left half.
 * A chunk that is beside a line and above it belongs to that line.
 */
function joinRaisedRights(lines: Row[][], spacing: number, unit: number) {
  const pending = lines.map((parts) => boundsOf(parts));
  const limit = spacing * 0.72;
  let changed = true;
  while (changed) {
    changed = false;
    pending.sort((a, b) => a.y - b.y);
    for (let i = 0; i < pending.length; i++) {
      const upper = pending[i];
      let best = -1;
      let bestDy = Infinity;
      for (let j = 0; j < pending.length; j++) {
        if (i === j) continue;
        const lower = pending[j];
        const dy = lower.y - upper.y;
        if (dy < 0 || dy > limit) continue;
        const gap = upper.left - lower.right;
        if (gap < -unit * 0.35 || gap > Math.max(spacing, unit) * 2.5) continue;
        if (dy < bestDy) {
          bestDy = dy;
          best = j;
        }
      }
      if (best >= 0) {
        pending[best] = boundsOf([...pending[best].parts, ...upper.parts]);
        pending.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return pending.sort((a, b) => a.y - b.y).map((line) => line.parts);
}

function boundsOf(parts: Row[]) {
  return {
    y: median(parts.map((part) => part.y)),
    left: Math.min(...parts.map((part) => part.left)),
    right: Math.max(...parts.map((part) => part.left + part.width)),
    parts,
  };
}
