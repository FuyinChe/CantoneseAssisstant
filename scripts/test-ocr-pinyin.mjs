import { flattenIllumination } from "../lib/ocr-preprocess.ts";
import { isPinyinAbovePage } from "../lib/ocr-pinyin.ts";

const even = Array.from({ length: 20 }, (_, i) => ({
  text: "字",
  width: 40,
  height: 44,
}));
if (isPinyinAbovePage(even)) {
  console.log("FAIL even page");
  process.exit(1);
}

const mixed = [
  ...Array.from({ length: 12 }, () => ({ text: "說", width: 90, height: 96 })),
  ...Array.from({ length: 10 }, () => ({ text: "的", width: 110, height: 210 })),
];
if (!isPinyinAbovePage(mixed)) {
  console.log("FAIL pinyin page");
  process.exit(1);
}

function image(width, height, paint) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = paint(x, y);
      const index = (y * width + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  return { width, height, data };
}

function mean(image, y0, y1) {
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < image.width; x++) {
      sum += image.data[(y * image.width + x) * 4];
      count += 1;
    }
  }
  return sum / count;
}

const gradient = image(80, 120, (x, y) => (y < 70 && x > 30 && x < 36 ? 30 : 210 - y));
if (!flattenIllumination(gradient)) {
  console.log("FAIL gradient not flattened");
  process.exit(1);
}
const top = mean(gradient, 0, 20);
const bottom = mean(gradient, 100, 120);
if (Math.abs(top - bottom) > 18) {
  console.log("FAIL paper still uneven", top, bottom);
  process.exit(1);
}
const stroke = gradient.data[(40 * 80 + 33) * 4];
if (stroke > 80) {
  console.log("FAIL stroke washed out", stroke);
  process.exit(1);
}

const flat = image(80, 80, () => 200);
if (flattenIllumination(flat)) {
  console.log("FAIL even page was rewritten");
  process.exit(1);
}

console.log("ALL PASS");
