import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { SHEET_KAI } from "@/lib/sheet-font";
import { wordBands } from "@/lib/sheet-layout";
import { siteName, siteNameEn, siteUrl } from "@/lib/site";
import { glyphTransform, tianziMarks, tianziSvgMarks, TIANZI_INK } from "@/lib/tianzi";

const FONT = '"PingFang HK", "Hiragino Sans CNS", "Noto Sans CJK HK", sans-serif';
const A4: [number, number] = [595.28, 841.89];
const SIDE = mm(12);
const HEADER_SPACE = mm(14);
const FOOTER_SPACE = mm(22);

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
  return A4[0] - SIDE * 2;
}

function contentTop() {
  return A4[1] - HEADER_SPACE;
}

function contentFloor() {
  return FOOTER_SPACE;
}

function printDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pdfFilename(kind: string, sentence: string) {
  const now = new Date();
  const stamp = `${printDate()}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const snippet = Array.from(sentence.replace(/\s+/g, "")).slice(0, 12).join("").replace(/[\\/:*?"<>|]/g, "");
  return `${kind}${snippet ? `-${snippet}` : ""}-${stamp}.pdf`;
}

async function embedFooter(doc: PDFDocument, lines: string[]) {
  const painted = paintLines(
    lines.map((text) => ({ text, size: 9, weight: 400, color: "#78716c" })),
    contentWidth(),
  );
  return {
    image: await doc.embedPng(pngBytes(painted.canvas)),
    width: painted.width,
    height: painted.height,
  };
}

function stampPages(
  doc: PDFDocument,
  font: PDFFont,
  footer: { image: PDFImage; width: number; height: number },
) {
  const pages = doc.getPages();
  const total = pages.length;
  const date = printDate();
  const mute = rgb(0.47, 0.44, 0.42);
  const rule = rgb(0.89, 0.85, 0.78);
  pages.forEach((page, index) => {
    const width = page.getWidth();
    const height = page.getHeight();
    const label = `page ${index + 1} of ${total}`;
    const labelWidth = font.widthOfTextAtSize(label, 9);
    page.drawText(date, {
      x: SIDE,
      y: height - mm(10),
      size: 9,
      font,
      color: mute,
    });
    page.drawText(label, {
      x: width - SIDE - labelWidth,
      y: height - mm(10),
      size: 9,
      font,
      color: mute,
    });
    page.drawLine({
      start: { x: SIDE, y: height - mm(12) },
      end: { x: width - SIDE, y: height - mm(12) },
      thickness: 0.4,
      color: rule,
    });
    page.drawImage(footer.image, {
      x: SIDE,
      y: mm(8),
      width: footer.width,
      height: footer.height,
    });
    page.drawLine({
      start: { x: SIDE, y: mm(8) + footer.height + 4 },
      end: { x: width - SIDE, y: mm(8) + footer.height + 4 },
      thickness: 0.4,
      color: rule,
    });
  });
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function tianzi(size: number) {
  return tianziSvgMarks(size);
}

function strokeSvg(strokes: string[], through: number, box: number) {
  const paths = strokes.slice(0, through).map((path, index) => {
    const fill = index === through - 1 ? "#9c3b2e" : "#1f1a14";
    return `<path d="${escapeAttr(path)}" fill="${fill}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <g transform="${glyphTransform(box)}">${paths}</g>
  </svg>`;
}

function practiceSvg(box: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <rect x="0.5" y="0.5" width="${box - 1}" height="${box - 1}" fill="#ffffff" stroke="#44403c"/>
    ${tianzi(box)}
  </svg>`;
}

const hanPattern = /\p{Script=Han}/u;

function modelTextCanvas(char: string, box: number, sizeRatio: number, fill = "#1f1a14", weight = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box * GLYPH_RATIO);
  canvas.height = Math.ceil(box * GLYPH_RATIO);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF 暂时没有保存下来。");
  context.scale(GLYPH_RATIO, GLYPH_RATIO);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, box, box);
  context.strokeStyle = "#44403c";
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, box - 1, box - 1);
  context.fillStyle = TIANZI_INK;
  for (const mark of tianziMarks(box)) {
    context.fillRect(mark.x, mark.y, mark.w, mark.h);
  }
  context.fillStyle = fill;
  context.font = `${weight} ${box * sizeRatio}px ${SHEET_KAI}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(char, box / 2, box / 2);
  return canvas;
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
  fontFamily?: string;
};

function paintLines(lines: TextLine[], maxWidth: number) {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("PDF 暂时没有保存下来。");
  const fontOf = (line: TextLine) => `${line.weight} ${line.size}px ${line.fontFamily ?? FONT}`;
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
  if (cursor.y - height >= contentFloor()) return cursor;
  const page = doc.addPage(A4);
  return { page, y: contentTop() };
}

async function drawText(doc: PDFDocument, cursor: Cursor, lines: TextLine[], gapAfter: number, keepWith = 0) {
  const painted = paintLines(lines, contentWidth());
  const image = await doc.embedPng(pngBytes(painted.canvas));
  const next = ensure(doc, cursor, painted.height + keepWith);
  next.page.drawImage(image, {
    x: SIDE,
    y: next.y - painted.height,
    width: painted.width,
    height: painted.height,
  });
  next.y -= painted.height + gapAfter;
  return next;
}

function drawImageRun(doc: PDFDocument, cursor: Cursor, images: PDFImage[], size: number, gap: number) {
  const perRow = Math.max(1, Math.floor((contentWidth() + gap) / (size + gap)));
  for (let start = 0; start < images.length; start += perRow) {
    const row = images.slice(start, start + perRow);
    cursor = ensure(doc, cursor, size);
    let x = SIDE;
    for (const image of row) {
      cursor.page.drawImage(image, { x, y: cursor.y - size, width: size, height: size });
      x += size + gap;
    }
    cursor.y -= size + gap;
  }
  return cursor;
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
  let x = SIDE;
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
  groups: string[][];
  boxSize?: SheetBoxSize;
}) {
  if (input.items.length === 0) throw new Error("还没有选择要打印的字。");
  const boxSize = input.boxSize ?? "small";
  const layout = boxLayouts[boxSize];
  const step = mm(6.5);
  const stepGap = mm(0.7);
  const doc = await PDFDocument.create();
  doc.setTitle("香港繁体笔顺工作纸");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const footer = await embedFooter(doc, [
    "黑色范字用标楷体-港澳。浅灰格供摹写，后面的空格供临写。上方分步笔画按 Make Me a Hanzi 的笔画数据绘出。",
    `${siteName} · ${siteNameEn}`,
    siteUrl,
  ]);
  const practice = await doc.embedPng(pngBytes(await rasterSvg(practiceSvg(layout.box), layout.box)));
  const steps = new Map<string, PDFImage>();
  const models = new Map<string, PDFImage>();
  const traces = new Map<string, PDFImage>();
  const stepJobs = new Map<string, Promise<HTMLCanvasElement>>();
  const bands = wordBands(input.groups, boxSize);
  const byChar = new Map(input.items.map((item) => [item.char, item.strokes]));

  function stepCanvas(char: string, strokes: string[], index: number) {
    const key = `${char}:${index}`;
    let job = stepJobs.get(key);
    if (!job) {
      job = rasterSvg(strokeSvg(strokes, index + 1, step), step);
      stepJobs.set(key, job);
    }
    return job;
  }

  await Promise.all(input.items.flatMap((item) => (
    item.strokes?.map((_, index) => stepCanvas(item.char, item.strokes ?? [], index)) ?? []
  )));
  for (const [key, job] of stepJobs) {
    steps.set(key, await doc.embedPng(pngBytes(await job)));
  }
  const unique = [...new Set(input.items.map((item) => item.char))];
  await Promise.all(unique.map(async (char) => {
    models.set(char, await doc.embedPng(pngBytes(modelTextCanvas(char, layout.box, 0.72))));
    traces.set(char, await doc.embedPng(pngBytes(modelTextCanvas(char, layout.box, 0.72, "#c4bdb4", 500))));
  }));

  let cursor: Cursor = { page: doc.addPage(A4), y: contentTop() };
  const header: TextLine[] = [
    { text: "香港繁体笔顺工作纸", size: 22, weight: 600, color: "#1c1917" },
    { text: input.sentence, size: 16, weight: 400, color: "#1c1917", fontFamily: SHEET_KAI },
  ];
  if (input.truncated) {
    header.push({ text: "句子较长，这张纸只排前 40 个字。", size: 11, weight: 400, color: "#57534e" });
  }
  cursor = await drawText(doc, cursor, header, 14);

  const ink = rgb(0.27, 0.25, 0.24);
  for (const band of bands) {
    const stepRows = band.chars.reduce((total, char) => {
      const count = byChar.get(char)?.length ?? 0;
      const per = Math.max(1, Math.floor((contentWidth() + stepGap) / (step + stepGap)));
      return total + (count > 0 ? Math.ceil(count / per) : 1);
    }, 0);
    const cells = band.models.length + band.traces.length + band.practice;
    const cellGap = -0.75;
    const perBox = Math.max(1, Math.floor((contentWidth() + cellGap) / (layout.box + cellGap)));
    const boxRows = Math.ceil(cells / perBox);
    const bandHeight = mm(3) + stepRows * (step + stepGap) + boxRows * layout.box + 18;
    cursor = ensure(doc, cursor, bandHeight);
    const top = cursor.y;
    const page = cursor.page;
    cursor.y -= mm(1.4);
    for (const char of band.chars) {
      const strokes = byChar.get(char) ?? null;
      if (strokes && strokes.length > 0) {
        const images = strokes.map((_, index) => {
          const image = steps.get(`${char}:${index}`);
          if (!image) throw new Error("PDF 暂时没有保存下来。");
          return image;
        });
        cursor = drawImageRun(doc, cursor, images, step, stepGap);
      } else {
        cursor = await drawText(doc, cursor, [
          { text: `${char}暂时没有笔顺数据，可以照着范字临写。`, size: 11, weight: 400, color: "#57534e" },
        ], stepGap);
      }
    }
    const modelImages = [...band.models, ...band.traces].map((char, index) => {
      const image = (index < band.models.length ? models : traces).get(char);
      if (!image) throw new Error("PDF 暂时没有保存下来。");
      return image;
    });
    cursor = drawImageRun(doc, cursor, [...modelImages, ...Array.from({ length: band.practice }, () => practice)], layout.box, cellGap);
    const counts = band.chars.map((char) => {
      const count = byChar.get(char)?.length;
      return count ? `${char} ${count}畫` : char;
    }).join("　");
    cursor = await drawText(doc, cursor, [
      { text: counts, size: 11, weight: 400, color: "#57534e" },
    ], mm(1.6));
    if (cursor.page === page) {
      page.drawRectangle({
        x: SIDE - mm(1),
        y: cursor.y,
        width: contentWidth() + mm(2),
        height: top - cursor.y,
        borderWidth: 0.8,
        borderColor: ink,
      });
    }
    cursor.y -= mm(3.5);
  }

  stampPages(doc, font, footer);
  await savePdf(doc, pdfFilename("香港繁体笔顺工作纸", input.sentence));
}

export async function downloadCopyPdf(input: {
  sentence: string;
  truncated: boolean;
  items: SheetItem[];
  boxSize?: SheetBoxSize;
}) {
  if (input.items.length === 0) throw new Error("还没有选择要打印的字。");
  const layout = boxLayouts[input.boxSize ?? "small"];
  const doc = await PDFDocument.create();
  doc.setTitle("香港繁体抄写工作纸");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const footer = await embedFooter(doc, [
    "上一行范字用标楷体-港澳，下一行田字格供抄写。",
    `${siteName} · ${siteNameEn}`,
    siteUrl,
  ]);
  const practice = await doc.embedPng(pngBytes(await rasterSvg(practiceSvg(layout.box), layout.box)));
  const models = new Map<string, PDFImage>();
  const unique = [...new Set(input.items.map((item) => item.char))];
  await Promise.all(unique.map(async (char) => {
    models.set(
      char,
      await doc.embedPng(pngBytes(modelTextCanvas(char, layout.box, hanPattern.test(char) ? 0.72 : 0.48))),
    );
  }));

  let cursor: Cursor = { page: doc.addPage(A4), y: contentTop() };
  const header: TextLine[] = [
    { text: "香港繁体抄写工作纸", size: 22, weight: 600, color: "#1c1917" },
    { text: input.sentence, size: 16, weight: 400, color: "#1c1917", fontFamily: SHEET_KAI },
  ];
  if (input.truncated) {
    header.push({ text: "句子较长，这张纸只排前 120 个字。", size: 11, weight: 400, color: "#57534e" });
  }
  cursor = await drawText(doc, cursor, header, 16);

  const perRow = Math.max(1, Math.floor((contentWidth() + layout.gap) / (layout.box + layout.gap)));
  const pairGap = layout.gap * 2;
  for (let start = 0; start < input.items.length; start += perRow) {
    const row = input.items.slice(start, start + perRow);
    const pairHeight = layout.box * 2 + layout.gap * 2 + pairGap;
    cursor = ensure(doc, cursor, pairHeight);
    const images = row.map((item) => {
      const image = models.get(item.char);
      if (!image) throw new Error("PDF 暂时没有保存下来。");
      return image;
    });
    cursor = drawBoxes(cursor, images, font, row.map(() => null), layout);
    cursor = drawBoxes(cursor, practice, font, row.map(() => null), layout);
    cursor.y -= pairGap;
  }

  stampPages(doc, font, footer);
  await savePdf(doc, pdfFilename("香港繁体抄写工作纸", input.sentence));
}

async function savePdf(doc: PDFDocument, filename: string) {
  const bytes = await doc.save();
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
