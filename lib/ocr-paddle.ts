import { linesFromBoxes, type OcrBox } from "./ocr-lines";
import { isPinyinAbovePage } from "./ocr-pinyin";
import { prepareOcrCanvas } from "./ocr-preprocess";
import { cleanOcrText } from "./ocr-text";
import { eraseZhuyinColumns } from "./ocr-zhuyin";

type PredictParams = {
  textDetThresh?: number;
  textDetBoxThresh?: number;
  textDetUnclipRatio?: number;
  textRecScoreThresh?: number;
};

type Paddle = {
  predict: (
    image: HTMLCanvasElement,
    params?: PredictParams,
  ) => Promise<Array<{ items: OcrBox[] }>>;
};

let enginePromise: Promise<Paddle> | null = null;

function assetUrl(file: string) {
  return new URL(file, window.location.origin).href;
}

async function trackedFetch(
  onProgress: (ratio: number) => void,
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, init);
  const total = Number(response.headers.get("content-length") || 0);
  if (!response.ok || !response.body || !total) return response;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress(Math.min(1, received / total));
    }
  }
  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function getEngine(onProgress: (ratio: number) => void) {
  if (!enginePromise) {
    enginePromise = import("@paddleocr/paddleocr-js").then(async ({ PaddleOCR }) => {
      let files = 0;
      const engine = await PaddleOCR.create({
        textDetectionModelName: "PP-OCRv5_mobile_det",
        textRecognitionModelName: "PP-OCRv5_mobile_rec",
        textDetectionModelAsset: { url: assetUrl("/ocr/PP-OCRv5_mobile_det.tar") },
        textRecognitionModelAsset: { url: assetUrl("/ocr/PP-OCRv5_mobile_rec.tar") },
        textDetLimitSideLen: 1600,
        textDetLimitType: "max",
        ortOptions: {
          backend: "wasm",
          wasmPaths: assetUrl("/ocr/ort/"),
          numThreads: 1,
          simd: true,
          disableWasmProxy: true,
        },
        fetch: (input, init) => {
          const index = files;
          files += 1;
          return trackedFetch((ratio) => {
            onProgress(Math.min(0.98, (index + ratio) / 2));
          }, input as RequestInfo, init);
        },
      });
      onProgress(1);
      return engine as Paddle;
    });
  }
  try {
    return await enginePromise;
  } catch (error) {
    enginePromise = null;
    throw error;
  }
}

/** Recognize with on-site PP-OCRv5 mobile weights. Throws if the engine cannot run. */
export async function recognizeWithPaddle(
  image: HTMLCanvasElement,
  onProgress?: (ratio: number) => void,
) {
  // Keep short strokes (the dot of 文). Pinyin is removed by color, not by blob size.
  const prepared = prepareOcrCanvas(image, { removeShortInk: false });
  const engine = await getEngine(onProgress ?? (() => {}));
  const [first] = await engine.predict(prepared);
  const items = first?.items ?? [];
  const polys = items.filter((item) => item.poly.length > 0).map((item) => item.poly);
  const bands = eraseZhuyinColumns(prepared, polys);
  const found = bands.length ? ((await engine.predict(prepared))[0]?.items ?? items) : items;
  // Black pinyin sits in the same box as the character when the detector
  // expands across the gap. A tighter box on that kind of page only.
  const pinyinPage = isPinyinAbovePage(found.map(sizedBox));
  const separated = pinyinPage
    ? ((await engine.predict(prepared, {
        textDetUnclipRatio: 0.7,
        textDetThresh: 0.15,
        textDetBoxThresh: 0.3,
      }))[0]?.items ?? found)
    : found;
  const recovered = await recoverTopGap(engine, prepared, separated);
  return cleanOcrText(linesFromBoxes([...separated, ...recovered]));
}

function sizedBox(item: OcrBox) {
  const box = bounds(item);
  return { text: item.text, width: box.width, height: box.height };
}

async function recoverTopGap(engine: Paddle, source: HTMLCanvasElement, items: OcrBox[]) {
  const measured = items.map((item) => ({ item, ...bounds(item) }));
  const mains = measured.filter((box) => hanCount(box.item.text) >= 4 && box.width > box.height * 3);
  const column = mains.length >= 2 ? mains : measured.filter((box) => hanCount(box.item.text) >= 1 && box.height >= 16);
  if (column.length < 2) return [];
  const firstTop = Math.min(...column.map((box) => box.top));
  const heights = column.map((box) => box.height).sort((a, b) => a - b);
  const charH = heights[Math.floor(heights.length * (mains.length >= 2 ? 0.5 : 0.25))] ?? 0;
  const minTop = mains.length >= 2 ? charH * 1.15 : source.height * 0.22;
  if (firstTop < minTop) return [];
  const lefts = column.map((box) => box.left).sort((a, b) => a - b);
  const rights = column.map((box) => box.right).sort((a, b) => a - b);
  const mainLeft = lefts[Math.floor(lefts.length * 0.2)] ?? 0;
  const mainRight = rights[Math.floor(rights.length * 0.8)] ?? source.width;
  const crop = cropRect(source, {
    left: Math.max(0, mainLeft - charH * 0.4),
    right: Math.min(source.width, mainRight + 8),
    top: 0,
    bottom: firstTop,
  });
  if (!crop) return [];
  const [part] = await engine.predict(crop.canvas, {
    textDetThresh: 0.2,
    textDetBoxThresh: 0.35,
    textRecScoreThresh: 0.4,
    ...(mains.length >= 2 ? {} : { textDetUnclipRatio: 0.7 }),
  });
  const minHan = mains.length >= 2 ? 2 : 1;
  const recovered: OcrBox[] = [];
  for (const item of part?.items ?? []) {
    if (item.score < 0.4 || hanCount(item.text) < minHan) continue;
    const shifted: OcrBox = {
      ...item,
      poly: item.poly.map(([x, y]) => [x + crop.left, y + crop.top]),
    };
    const box = bounds(shifted);
    if (box.bottom > firstTop + charH * 0.2) continue;
    if (box.right < mainLeft - charH * 0.15) continue;
    if (overlaps(box, column)) continue;
    recovered.push(shifted);
  }
  return recovered;
}

function hanCount(text: string) {
  return (text.match(/\p{Script=Han}/gu) ?? []).length;
}

function bounds(item: OcrBox) {
  const xs = item.poly.map((point) => point[0]);
  const ys = item.poly.map((point) => point[1]);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

function overlaps(
  box: { left: number; right: number; top: number; bottom: number },
  known: Array<{ left: number; right: number; top: number; bottom: number }>,
) {
  const height = box.bottom - box.top;
  const width = box.right - box.left;
  return known.some((other) => {
    const overlapY = Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
    const overlapX = Math.min(box.right, other.right) - Math.max(box.left, other.left);
    return overlapY > height * 0.45 && overlapX > width * 0.4;
  });
}

function cropRect(
  source: HTMLCanvasElement,
  rect: { left: number; right: number; top: number; bottom: number },
) {
  const left = Math.max(0, Math.floor(rect.left));
  const top = Math.max(0, Math.floor(rect.top));
  const width = Math.min(source.width - left, Math.ceil(rect.right) - left);
  const height = Math.min(source.height - top, Math.ceil(rect.bottom) - top);
  if (width < 80 || height < 24) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, left, top, width, height, 0, 0, width, height);
  return { canvas, left, top };
}
