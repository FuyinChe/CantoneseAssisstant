import { recognizeWithPaddle } from "./ocr-paddle";
import { OCR_PREP_VARIANTS, prepareOcrCanvas, type PreprocessOptions } from "./ocr-preprocess";
import { cleanOcrText } from "./ocr-text";

export type OcrProgress = {
  status: string;
  progress: number;
};

type Worker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;

let workerPromise: Promise<Worker> | null = null;
let onProgress: ((progress: OcrProgress) => void) | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(async ({ createWorker }) => {
      // Traditional first — HK/TW textbooks; simplified still available as fallback glyphs.
      const worker = await createWorker("chi_tra+chi_sim", 1, {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",
        logger: (message) => {
          onProgress?.({
            status: message.status,
            progress: message.progress,
          });
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
      });
      return worker;
    });
  }
  try {
    return await workerPromise;
  } catch (error) {
    workerPromise = null;
    throw error;
  }
}

function rawFromResult(data: { text: string; lines?: Array<{ text: string }> }) {
  const lines = data.lines?.map((line) => line.text.trimEnd()).filter((line) => line.length > 0);
  if (lines && lines.length > 0) return lines.join("\n");
  return data.text;
}

function hanCount(text: string) {
  return (text.match(/\p{Script=Han}/gu) ?? []).length;
}

function latinCount(text: string) {
  return (text.match(/[A-Za-z]/g) ?? []).length;
}

/** Prefer more Han, fewer leftover Latin letters, then higher engine confidence. */
export function scoreOcrCandidate(text: string, confidence: number) {
  const han = hanCount(text);
  const latin = latinCount(text);
  return han * 3 - latin * 1.5 + confidence * 0.35;
}

function isWeakResult(text: string, confidence: number) {
  const han = hanCount(text);
  const latin = latinCount(text);
  if (han < 12) return true;
  if (confidence < 42) return true;
  if (han > 0 && latin / Math.max(han, 1) > 0.45) return true;
  return false;
}

async function recognizePrepared(
  worker: Worker,
  source: HTMLCanvasElement,
  options?: PreprocessOptions,
) {
  const prepared = prepareOcrCanvas(source, options);
  const result = await worker.recognize(prepared);
  const text = cleanOcrText(rawFromResult(result.data));
  return {
    text,
    confidence: result.data.confidence ?? 0,
    score: scoreOcrCandidate(text, result.data.confidence ?? 0),
  };
}

export async function recognizeImage(
  image: HTMLCanvasElement,
  progress?: (update: OcrProgress) => void,
) {
  onProgress = progress ?? null;
  try {
    progress?.({ status: "loading model", progress: 0 });
    try {
      const text = await recognizeWithPaddle(image, (ratio) => {
        progress?.({ status: "loading model", progress: ratio });
      });
      if (text.trim()) return text;
    } catch (error) {
      console.warn("PaddleOCR failed, using the fallback recognizer.", error);
    }

    progress?.({ status: "recognizing", progress: 0 });
    const worker = await getWorker();
    const shortCrop =
      image.height < 260 || image.height / Math.max(image.width, 1) < 0.42;
    const first = await recognizePrepared(worker, image, OCR_PREP_VARIANTS[0]);
    if (!shortCrop && !isWeakResult(first.text, first.confidence)) {
      return first.text;
    }

    let best = first;
    for (const variant of OCR_PREP_VARIANTS.slice(1)) {
      const next = await recognizePrepared(worker, image, variant);
      if (next.score > best.score) best = next;
    }
    return best.text;
  } finally {
    onProgress = null;
  }
}
