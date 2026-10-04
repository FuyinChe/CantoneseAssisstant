import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { siteName, siteNameEn, siteUrl } from "@/lib/site";

const FONT = '"PingFang HK", "Hiragino Sans CNS", "Noto Sans CJK HK", sans-serif';
const A4: [number, number] = [595.28, 841.89];
const MARGIN = (12 / 25.4) * 72;

export type SheetBoxSize = "large" | "small";

type BoxLayout = {
  box: number;
  gap: number;
};

function mm(value: number) {
  return (value / 25.4) * 72;
}

const boxLayouts: Record<SheetBoxSize, BoxLayout> = {
  large: { box: mm(28), gap: mm(2.5) },
  small: { box: mm(16), gap: mm(1.8) },
};
const TEXT_RATIO = 2;
const GLYPH_RATIO = 3;

type SheetItem = {
  char: string;
  strokes: string[] | null;
};

type Cursor = {
  page: PDFPage;
  y: number;
};

function contentWidth() {
  return A4[0] - MARGIN * 2;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function tianzi(size: number) {
  const mid = size / 2;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#78716c" stroke-width="1" stroke-dasharray="4 3"/>`;
  return `${line(mid, 1, mid, size - 1)}${line(1, mid, size - 1, mid)}`;
}

function strokeSvg(strokes: string[], through: number, box: number) {
  const scale = box / 1024;
  const paths = strokes.slice(0, through).map((path, index) => {
    const fill = index === through - 1 ? "#9c3b2e" : "#1f1a14";
    return `<path d="${escapeAttr(path)}" fill="${fill}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <rect x="0.5" y="0.5" width="${box - 1}" height="${box - 1}" fill="#ffffff" stroke="#d6d3d1"/>
    ${tianzi(box)}
    <g transform="translate(0 ${box}) scale(${scale} ${-scale})">${paths}</g>
  </svg>`;
}

function practiceSvg(box: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <rect x="0.5" y="0.5" width="${box - 1}" height="${box - 1}" fill="#ffffff" stroke="#44403c"/>
    ${tianzi(box)}
  </svg>`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PDF 暂时没有保存下来。"));
    image.src = src;
  });
}

async function rasterSvg(svg: string, box: number) {
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box * GLYPH_RATIO);
  canvas.height = Math.ceil(box * GLYPH_RATIO);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF 暂时没有保存下来。");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function pngBytes(canvas: HTMLCanvasElement) {
  const data = canvas.toDataURL("image/png").split(",")[1] ?? "";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

type TextLine = {
  text: string;
  size: number;
  weight: number;
  color: string;
};

function paintLines(lines: TextLine[], maxWidth: number) {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("PDF 暂时没有保存下来。");
  const fontOf = (line: TextLine) => `${line.weight} ${line.size}px ${FONT}`;
  const wrapped: { text: string; line: TextLine; height: number }[] = [];
  for (const line of lines) {
    measure.font = fontOf(line);
    const height = Math.ceil(line.size * 1.35);
    let current = "";
    for (const char of Array.from(line.text)) {
      const next = current + char;
      if (current && measure.measureText(next).width > maxWidth) {
        wrapped.push({ text: current, line, height });
        current = char;
      } else {
        current = next;
      }
    }
    if (current) wrapped.push({ text: current, line, height });
  }
  const gap = 4;
  const height = wrapped.reduce((sum, item, index) => sum + item.height + (index > 0 ? gap : 0), 0) || 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(maxWidth * TEXT_RATIO);
  canvas.height = Math.ceil(height * TEXT_RATIO);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF 暂时没有保存下来。");
  context.scale(TEXT_RATIO, TEXT_RATIO);
  context.textBaseline = "top";
  let y = 0;
  for (const [index, item] of wrapped.entries()) {
    context.font = fontOf(item.line);
    context.fillStyle = item.line.color;
    context.fillText(item.text, 0, y);
    y += item.height + (index < wrapped.length - 1 ? gap : 0);
  }
  return { canvas, width: maxWidth, height };
}

function ensure(doc: PDFDocument, cursor: Cursor, height: number) {
  if (cursor.y - height >= MARGIN) return cursor;
  const page = doc.addPage(A4);
  return { page, y: page.getHeight() - MARGIN };
}

async function drawText(doc: PDFDocument, cursor: Cursor, lines: TextLine[], gapAfter: number, keepWith = 0) {
  const painted = paintLines(lines, contentWidth());
  const image = await doc.embedPng(pngBytes(painted.canvas));
  const next = ensure(doc, cursor, painted.height + keepWith);
  next.page.drawImage(image, {
    x: MARGIN,
    y: next.y - painted.height,
    width: painted.width,
    height: painted.height,
  });
  next.y -= painted.height + gapAfter;
  return next;
}

function drawBoxes(
  cursor: Cursor,
  image: PDFImage | PDFImage[],
  font: PDFFont,
  labels: Array<string | null>,
  layout: BoxLayout,
) {
  const hasLabel = labels.some((label) => label);
  const rowHeight = layout.box + (hasLabel ? 12 : 0);
  let x = MARGIN;
  labels.forEach((label, index) => {
    const cell = Array.isArray(image) ? image[index] : image;
    cursor.page.drawImage(cell, { x, y: cursor.y - layout.box, width: layout.box, height: layout.box });
    if (label) {
      const width = font.widthOfTextAtSize(label, 8);
      cursor.page.drawText(label, {
        x: x + (layout.box - width) / 2,
        y: cursor.y - layout.box - 10,
        size: 8,
        font,
        color: rgb(0.44, 0.4, 0.36),
      });
    }
    x += layout.box + layout.gap;
  });
  cursor.y -= rowHeight + layout.gap;
  return cursor;
}

export async function downloadStrokePdf(input: {
  sentence: string;
  truncated: boolean;
  items: SheetItem[];
  boxSize?: SheetBoxSize;
  practiceBoxes?: number;
}) {
  if (input.items.length === 0) throw new Error("还没有选择要打印的字。");
  const layout = boxLayouts[input.boxSize ?? "large"];
  const practiceBoxes = input.practiceBoxes ?? 5;
  const doc = await PDFDocument.create();
  doc.setTitle("香港繁体笔顺工作纸");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const practice = await doc.embedPng(pngBytes(await rasterSvg(practiceSvg(layout.box), layout.box)));
  const glyphs = new Map<string, PDFImage>();
  const jobs = new Map<string, Promise<HTMLCanvasElement>>();

  function glyphCanvas(item: SheetItem, step: number) {
    const key = `${item.char}:${step}`;
    let job = jobs.get(key);
    if (!job) {
      job = rasterSvg(strokeSvg(item.strokes ?? [], step + 1, layout.box), layout.box);
      jobs.set(key, job);
    }
    return job;
  }

  await Promise.all(input.items.flatMap((item) => (
    item.strokes?.map((_, step) => glyphCanvas(item, step)) ?? []
  )));
  for (const [key, job] of jobs) {
    glyphs.set(key, await doc.embedPng(pngBytes(await job)));
  }

  let cursor: Cursor = { page: doc.addPage(A4), y: A4[1] - MARGIN };
  const header: TextLine[] = [
    { text: "香港繁体笔顺工作纸", size: 22, weight: 600, color: "#1c1917" },
    { text: input.sentence, size: 16, weight: 400, color: "#1c1917" },
  ];
  if (input.truncated) {
    header.push({ text: "句子较长，这张纸只排前 40 个字。", size: 11, weight: 400, color: "#57534e" });
  }
  cursor = await drawText(doc, cursor, header, 18);

  const perRow = Math.max(1, Math.floor((contentWidth() + layout.gap) / (layout.box + layout.gap)));
  const pageRoom = A4[1] - MARGIN * 2;
  for (const item of input.items) {
    const strokeCount = item.strokes?.length ?? 0;
    const strokeRows = strokeCount > 0 ? Math.ceil(strokeCount / perRow) : 1;
    const practiceRows = Math.ceil(practiceBoxes / perRow);
    const rowHeight = layout.box + 12 + layout.gap;
    const sectionHeight = Math.ceil(28 * 1.35) + 8
      + (strokeCount > 0 ? strokeRows * rowHeight : Math.ceil(11 * 1.35) + 8)
      + practiceRows * (layout.box + layout.gap)
      + 12;
    if (sectionHeight <= pageRoom && cursor.y - MARGIN < sectionHeight) {
      cursor = { page: doc.addPage(A4), y: A4[1] - MARGIN };
    }
    const follow = item.strokes && item.strokes.length > 0 ? layout.box + 16 : 28;
    cursor = await drawText(doc, cursor, [
      { text: item.char, size: 28, weight: 500, color: "#1c1917" },
    ], 8, follow);
    if (item.strokes && item.strokes.length > 0) {
      for (let start = 0; start < item.strokes.length; start += perRow) {
        const steps = item.strokes.slice(start, start + perRow);
        cursor = ensure(doc, cursor, layout.box + 12);
        const images = steps.map((_, offset) => {
          const cell = glyphs.get(`${item.char}:${start + offset}`);
          if (!cell) throw new Error("PDF 暂时没有保存下来。");
          return cell;
        });
        cursor = drawBoxes(cursor, images, font, steps.map((_, offset) => String(start + offset + 1)), layout);
      }
    } else {
      cursor = await drawText(doc, cursor, [
        { text: "这个字暂时没有笔顺数据，可以照着字本身临写。", size: 11, weight: 400, color: "#57534e" },
      ], 8);
    }
    for (let start = 0; start < practiceBoxes; start += perRow) {
      const count = Math.min(practiceBoxes - start, perRow);
      cursor = ensure(doc, cursor, layout.box);
      cursor = drawBoxes(cursor, practice, font, Array.from({ length: count }, () => null), layout);
    }
    cursor.y -= 12;
  }

  cursor = await drawText(doc, cursor, [
    { text: "笔顺按 Make Me a Hanzi 的笔画数据绘出，供临写参考。", size: 9, weight: 400, color: "#78716c" },
    { text: `${siteName} · ${siteNameEn}`, size: 9, weight: 400, color: "#78716c" },
    { text: siteUrl, size: 9, weight: 400, color: "#78716c" },
  ], 0);

  const bytes = await doc.save();
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "香港繁体笔顺工作纸.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}
