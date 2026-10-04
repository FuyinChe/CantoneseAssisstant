export type OcrProgress = {
  status: string;
  progress: number;
};

type Worker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;

let workerPromise: Promise<Worker> | null = null;
let onProgress: ((progress: OcrProgress) => void) | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(({ createWorker }) =>
      createWorker("chi_sim+chi_tra", 1, {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",
        logger: (message) => {
          onProgress?.({
            status: message.status,
            progress: message.progress,
          });
        },
      }),
    );
  }
  try {
    return await workerPromise;
  } catch (error) {
    workerPromise = null;
    throw error;
  }
}

export async function recognizeImage(
  image: HTMLCanvasElement,
  progress?: (update: OcrProgress) => void,
) {
  onProgress = progress ?? null;
  try {
    const worker = await getWorker();
    const result = await worker.recognize(image);
    return result.data.text.replaceAll(/\s+/g, "").trim();
  } finally {
    onProgress = null;
  }
}
