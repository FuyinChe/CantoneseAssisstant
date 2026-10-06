/**
 * Browser-side OCR image prep for Chinese textbook pages:
 * upscale small photos, drop blue/red pinyin ink, strip leftover short blobs.
 */

const TARGET_WIDTH = 2200;
const TARGET_WIDTH_SMALL = 2800;
const MAX_WIDTH = 3200;
const SMALL_SOURCE = 900;

export type PreprocessOptions = {
  /** Drop near-paper / very light flecks above this luminance (0–255). */
  maxLum?: number;
  /** Drop ink whose blue channel exceeds red by this margin. */
  minBlueDelta?: number;
  /** Drop strong red pinyin when red exceeds blue by this margin. */
  minRedDelta?: number;
  /** Force colored-pinyin filtering even when tinted ink is scarce. */
  forceFilter?: boolean;
  /** Remove hollow circles / thin underlines after ink filtering. */
  removeMarks?: boolean;
  /** Drop short leftover ink blobs (typical of pinyin letters). */
  removeShortInk?: boolean;
  /** When false, only upscale. Paddle drops pinyin boxes itself. */
  filterInk?: boolean;
};

type ResolvedOptions = Required<PreprocessOptions>;

const DEFAULTS: ResolvedOptions = {
  maxLum: 148,
  minBlueDelta: 6,
  minRedDelta: 14,
  forceFilter: false,
  removeMarks: true,
  removeShortInk: true,
  filterInk: true,
};

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value | 0));
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * True when a pixel looks like blue/red textbook pinyin — not black Han print.
 * Do not drop mid-grey by luminance alone (erodes anti-aliased Han strokes).
 */
export function isPinyinInk(
  r: number,
  g: number,
  b: number,
  opts: Pick<ResolvedOptions, "maxLum" | "minBlueDelta" | "minRedDelta">,
) {
  const lum = luminance(r, g, b);
  if (lum > opts.maxLum) return true;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const blueish = b > r + opts.minBlueDelta && b >= g - 2 && chroma >= 12;
  // Strong red ruby (not warm-cast black print — requires clear chroma).
  const reddish = r > b + opts.minRedDelta && r > g + 6 && chroma >= 18;
  const coolGrey = chroma < 18 && b >= r - 1 && b >= g - 1;
  if (blueish && lum > 58) return true;
  if (reddish && lum > 50 && lum < 195) return true;
  if (coolGrey && lum > 95 && lum < 175) return true;
  return false;
}

/** Sample whether the page has enough blue/red mid-tone ink to warrant filtering. */
export function hasColoredPinyinInk(
  image: ImageData,
  opts: Pick<ResolvedOptions, "maxLum" | "minBlueDelta" | "minRedDelta">,
) {
  const { data } = image;
  let ink = 0;
  let tinted = 0;
  const step = Math.max(4, Math.floor(data.length / 4 / 40000) * 4);
  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = luminance(r, g, b);
    if (lum > 200) continue;
    ink += 1;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const blueish = b > r + opts.minBlueDelta && b >= g - 2 && chroma >= 10;
    const reddish = r > b + opts.minRedDelta && r > g + 4 && chroma >= 16;
    if ((blueish || reddish) && lum > 55 && lum < 185) tinted += 1;
  }
  return ink > 200 && tinted / ink >= 0.05;
}

/** @deprecated Use hasColoredPinyinInk */
export const hasCoolPinyinInk = hasColoredPinyinInk;

/** Mutate RGBA ImageData: whitening pinyin-like ink, darken remaining strokes. */
export function filterPinyinInk(image: ImageData, options?: PreprocessOptions) {
  const opts = { ...DEFAULTS, ...options };
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = luminance(r, g, b);
    if (lum > 198 || isPinyinInk(r, g, b, opts)) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
      continue;
    }
    const ink = lum < 78 ? 0 : clampByte(Math.round((lum - 28) * 1.15));
    data[i] = ink;
    data[i + 1] = ink;
    data[i + 2] = ink;
    data[i + 3] = 255;
  }
  return image;
}

/**
 * After color filtering, drop short connected components typical of leftover
 * pinyin letter strokes. Keeps taller Han-sized blobs.
 */
export function removeShortInkBlobs(image: ImageData) {
  const { width: w, height: h, data } = image;
  const bin = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    bin[p] = data[i] < 150 ? 1 : 0;
  }

  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const heights: number[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!bin[start] || seen[start]) continue;
      let top = 0;
      stack[top++] = start;
      seen[start] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      while (top) {
        const index = stack[--top];
        count += 1;
        const cy = (index / w) | 0;
        const cx = index - cy * w;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ] as const) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const next = ny * w + nx;
          if (!bin[next] || seen[next]) continue;
          seen[next] = 1;
          stack[top++] = next;
        }
      }
      const ch = maxY - minY + 1;
      const cw = maxX - minX + 1;
      const ar = cw / ch;
      if (ch >= 28 && ch <= 150 && ar >= 0.35 && ar <= 1.75 && count >= 60) {
        heights.push(ch);
      }
    }
  }

  if (heights.length < 8) return image;
  heights.sort((a, b) => a - b);
  const charH = heights[Math.floor(heights.length * 0.65)] || 50;
  const dropH = Math.max(10, Math.floor(charH * 0.42));

  seen.fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!bin[start] || seen[start]) continue;
      let top = 0;
      stack[top++] = start;
      seen[start] = 1;
      const pixels: number[] = [];
      let minY = y;
      let maxY = y;
      while (top) {
        const index = stack[--top];
        pixels.push(index);
        const cy = (index / w) | 0;
        const cx = index - cy * w;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ] as const) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const next = ny * w + nx;
          if (!bin[next] || seen[next]) continue;
          seen[next] = 1;
          stack[top++] = next;
        }
      }
      const ch = maxY - minY + 1;
      if (ch > dropH) continue;
      for (const index of pixels) {
        const i = index * 4;
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
  }

  return image;
}

/**
 * Wipe hollow pen circles and thin underlines that wrap textbook words.
 * Operates on greyscale ImageData (ink near 0, paper near 255).
 */
export function removeHandMarks(image: ImageData, circles = true) {
  const { width: w, height: h, data } = image;
  const bin = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    bin[p] = data[i] < 150 ? 1 : 0;
  }

  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!bin[start] || seen[start]) continue;

      let top = 0;
      stack[top++] = start;
      seen[start] = 1;
      const pixels: number[] = [];
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (top) {
        const index = stack[--top];
        pixels.push(index);
        const cy = (index / w) | 0;
        const cx = index - cy * w;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ] as const) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const next = ny * w + nx;
          if (!bin[next] || seen[next]) continue;
          seen[next] = 1;
          stack[top++] = next;
        }
      }

      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const area = bw * bh;
      const fill = pixels.length / area;
      const underlineThick = Math.max(4, Math.round(h * (h < 900 ? 0.03 : 0.01)));
      const isUnderline =
        bh <= underlineThick && bw >= Math.max(28, Math.round(w * 0.08)) && bw >= bh * 6;
      const isHollow =
        circles &&
        bw >= Math.max(36, Math.round(w * 0.045)) &&
        bh >= Math.max(28, Math.round(h * 0.04)) &&
        fill < 0.2 &&
        pixels.length >= 60;
      const isSparseBlob = circles && area > w * h * 0.035 && fill < 0.16;

      if (!isUnderline && !isHollow && !isSparseBlob) continue;

      for (const index of pixels) {
        const i = index * 4;
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
  }

  return image;
}

function scaleForOcr(width: number, height: number) {
  const target = width < SMALL_SOURCE ? TARGET_WIDTH_SMALL : TARGET_WIDTH;
  if (width >= target) {
    if (width > MAX_WIDTH) {
      const scale = MAX_WIDTH / width;
      return { width: MAX_WIDTH, height: Math.round(height * scale) };
    }
    return { width, height };
  }
  const scale = target / width;
  return { width: target, height: Math.round(height * scale) };
}

/**
 * Returns a canvas ready for Tesseract: upscaled when needed, colored pinyin
 * removed when detected, optional short-blob / hand-mark wipe.
 */
export function prepareOcrCanvas(source: HTMLCanvasElement, options?: PreprocessOptions) {
  const opts = { ...DEFAULTS, ...options };
  const shortCrop = source.height < 260 || source.height / Math.max(source.width, 1) < 0.42;
  const { width, height } = scaleForOcr(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return source;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  if (!opts.filterInk) return canvas;

  const image = context.getImageData(0, 0, width, height);
  const shouldFilter = opts.forceFilter || hasColoredPinyinInk(image, opts);
  const wipeMarks = opts.removeMarks;
  if (shouldFilter) {
    filterPinyinInk(image, opts);
    if (opts.removeShortInk) removeShortInkBlobs(image);
    if (wipeMarks) removeHandMarks(image, !shortCrop);
    context.putImageData(image, 0, 0);
  } else if (wipeMarks) {
    for (let i = 0; i < image.data.length; i += 4) {
      const value = luminance(image.data[i], image.data[i + 1], image.data[i + 2]);
      const ink = clampByte(Math.round(value));
      image.data[i] = ink;
      image.data[i + 1] = ink;
      image.data[i + 2] = ink;
    }
    removeHandMarks(image, !shortCrop);
    context.putImageData(image, 0, 0);
  }
  return canvas;
}

/** Prep variants tried when the first pass looks weak. */
export const OCR_PREP_VARIANTS: PreprocessOptions[] = [
  { maxLum: 148, minBlueDelta: 6, minRedDelta: 14, removeMarks: false, removeShortInk: true },
  { maxLum: 140, minBlueDelta: 5, minRedDelta: 12, forceFilter: true, removeMarks: false, removeShortInk: true },
  { maxLum: 155, minBlueDelta: 6, minRedDelta: 14, forceFilter: true, removeMarks: false, removeShortInk: false },
];
