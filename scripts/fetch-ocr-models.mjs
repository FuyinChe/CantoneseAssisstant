/**
 * Download PP-OCRv5 mobile weights and the ONNX WASM runtime into public/ocr
 * so the site serves them. Browsers cache these after the first visit.
 */
import { createWriteStream } from "node:fs";
import { access, copyFile, mkdir, stat, symlink, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ocrDir = path.join(root, "public", "ocr");
const ortDir = path.join(ocrDir, "ort");

const models = [
  {
    file: "PP-OCRv5_mobile_det.tar",
    bytes: 4_843_520,
    url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx_infer.tar",
  },
  {
    file: "PP-OCRv5_mobile_rec.tar",
    bytes: 16_701_440,
    url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar",
  },
];

const wasmFiles = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
];

async function sameSize(file, bytes) {
  try {
    const info = await stat(file);
    return info.size === bytes;
  } catch {
    return false;
  }
}

async function download(url, dest, bytes) {
  if (await sameSize(dest, bytes)) {
    console.log("ok", path.relative(root, dest));
    return;
  }
  console.log("fetch", path.relative(root, dest));
  const response = await fetch(url, { headers: { "user-agent": "CantoneseAssistant/ocr-models" } });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
  const info = await stat(dest);
  if (info.size !== bytes) {
    throw new Error(`Size mismatch for ${dest}: got ${info.size}, expected ${bytes}`);
  }
}

await mkdir(ortDir, { recursive: true });
for (const model of models) {
  await download(model.url, path.join(ocrDir, model.file), model.bytes);
}

const ortSrc = path.join(root, "node_modules", "onnxruntime-web", "dist");
await access(ortSrc);
for (const name of wasmFiles) {
  const dest = path.join(ortDir, name);
  await copyFile(path.join(ortSrc, name), dest);
  console.log("ok", path.relative(root, dest));
}

// The SDK worker references these by URL next to its bundle. Link them so the bundler can resolve them.
const assetDir = path.join(root, "node_modules", "@paddleocr", "paddleocr-js", "dist", "assets");
for (const name of ["ort.bundle.min.mjs", "ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) {
  const dest = path.join(assetDir, name);
  try {
    await unlink(dest);
  } catch {
    // absent
  }
  await symlink(path.join(ortSrc, name), dest);
  console.log("link", path.relative(root, dest));
}
