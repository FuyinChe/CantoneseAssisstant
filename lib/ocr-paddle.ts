import { linesFromBoxes, type OcrBox } from "./ocr-lines";
import { prepareOcrCanvas } from "./ocr-preprocess";
import { cleanOcrText } from "./ocr-text";
import { eraseZhuyinColumns } from "./ocr-zhuyin";

type Paddle = {
  predict: (image: HTMLCanvasElement) => Promise<Array<{ items: OcrBox[] }>>;
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
  if (!bands.length) return cleanOcrText(linesFromBoxes(items));

  const [second] = await engine.predict(prepared);
  return cleanOcrText(linesFromBoxes(second?.items ?? items));
}
